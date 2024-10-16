import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { AsyncExportEvent } from "./async.types";
import stream from "stream";
import archiver from "archiver";
import ErrorLogger from "common/errorLogger/errorLogger";
import CSVtoZipPipeline from "export/async/CSVtoZipPipeline";
import uploadZipToS3 from "./uploadZipToS3";
import { getDomainName, getDownloadBucketName, getDownloadBucketRegion } from "server/config/config";
import OccupationGroupsToCSVTransform from "export/esco/occupationGroup/OccupationGroupsToCSVTransform";
import SkillsToCSVTransform from "export/esco/skill/SkillsToCSVTransform";
import SkillGroupsToCSVTransform from "export/esco/skillGroup/SkillGroupsToCSVTransform";
import OccupationHierarchyToCSVTransform from "export/esco/occupationHierarchy/occupationHierarchyToCSVTransform";
import SkillHierarchyToCSVTransform from "export/esco/skillHierarchy/skillHierarchyToCSVTransform";
import OccupationToSkillRelationToCSVTransform from "export/esco/occupationToSkillRelation/occupationToSkillRelationToCSVTransform";
import SkillToSkillRelationToCSVTransform from "export/esco/skillToSkillRelation/skillToSkillRelationToCSVTransform";
import ModelInfoToCSVTransform from "export/modelInfo/modelInfoToCSVTransform";
import OccupationsToCSVTransform from "export/esco/occupation/OccupationsToCSVTransform";
import LicenseToFileTransform from "export/license/licenseToFileTransform";

/**
 * Exports a model into a zip file containing all the entities in the database pertaining to that model,
 * and uploads it an S3 bucket.
 *
 * @param  event - The event object containing modelId of the model to export and the export process state id.
 * @throws Error - This function throws error that must be handled by the calling asyncExport handler.
 * @returns
 *
 * This function is responsible for exporting model data from the database into a series of CSV files, compressing it into a zip file
 * and then uploading it to an S3 bucket. It updates the export process state in the database to reflect
 * the status of the export operation. The function is designed to throw errors for explicit error handling in the
 * asyncExport process. These errors should be caught and processed by the calling function to handle retries or
 * cleanup operations as necessary.
 */

export const modelToS3 = async (event: AsyncExportEvent) => {
  // Set the export process status to RUNNING
  await getRepositoryRegistry().exportProcessState.update(event.exportProcessStateId, {
    status: ExportProcessStateAPISpecs.Enums.Status.RUNNING,
    result: {
      errored: false, // checking parsing errors and warning is an upcoming feature
      exportErrors: false,
      exportWarnings: false,
    },
  });

  const STAT_CONCURRENCY = 4;
  const streamResources = [];
  const zipper = archiver.create("zip", { zlib: { level: 9 }, statConcurrency: STAT_CONCURRENCY });
  streamResources.push(zipper);
  try {
    // Main logic to update ExportProcessState
    // This is where the exporting of the db to CSV and zipping and uploading happens

    const passThrough = new stream.PassThrough({ emitClose: true });
    streamResources.push(passThrough);
    // Here we pipe the archiver into a passThrough since the archiver is a writableStream and we
    // want a readable stream to send to S3

    zipper.pipe(passThrough);

    // For each Collection in the DB
    [
      {
        collectionName: "OccupationGroups",
        fileName: FILENAMES.OccupationGroups,
        csvStream: OccupationGroupsToCSVTransform,
      },
      {
        collectionName: "Occupations",
        fileName: FILENAMES.Occupations,
        csvStream: OccupationsToCSVTransform,
      },
      { collectionName: "Skill Groups", fileName: FILENAMES.SkillGroups, csvStream: SkillGroupsToCSVTransform },
      { collectionName: "Skills", fileName: FILENAMES.Skills, csvStream: SkillsToCSVTransform },
      {
        collectionName: "Occupation Hierarchy",
        fileName: FILENAMES.OccupationHierarchy,
        csvStream: OccupationHierarchyToCSVTransform,
      },
      {
        collectionName: "Skill Hierarchy",
        fileName: FILENAMES.SkillHierarchy,
        csvStream: SkillHierarchyToCSVTransform,
      },
      {
        collectionName: "Occupation to Skill Relation",
        fileName: FILENAMES.OccupationToSkillRelations,
        csvStream: OccupationToSkillRelationToCSVTransform,
      },
      {
        collectionName: "Skill to Skill Relation",
        fileName: FILENAMES.SkillToSkillRelations,
        csvStream: SkillToSkillRelationToCSVTransform,
      },
    ].forEach((item) => {
      const stream = item.csvStream(event.modelId);
      streamResources.push(stream);
      CSVtoZipPipeline(item.collectionName, item.fileName, stream, zipper, (error?: Error) => {
        if (error) {
          // If the pipeline failed then the passThrough must be destroyed as the archiver does not handle the clean-up of the streams
          // If the passThrough is not destroyed, the uploadZipToS3 will hang waiting for the stream to end
          passThrough.destroy();
        }
      });
    });

    // for modelInfo since it is asynchronous
    const modelInfoStream = await ModelInfoToCSVTransform(event.modelId);
    streamResources.push(modelInfoStream);
    CSVtoZipPipeline("ModelInfo", FILENAMES.ModelInfo, modelInfoStream, zipper, (error?: Error) => {
      if (error) {
        // If the pipeline failed then the passThrough must be destroyed as the archiver does not handle the clean-up of the streams
        // If the passThrough is not destroyed, the uploadZipToS3 will hang waiting for the stream to end
        passThrough.destroy();
      }
    });

    // for license since it is asynchronous,
    // and it is one string we are going to write in its own file.
    const licenseStream = await LicenseToFileTransform(event.modelId);
    streamResources.push(licenseStream);
    CSVtoZipPipeline("LICENSE", FILENAMES.License, licenseStream, zipper, (error?: Error) => {
      if (error) {
        // If the pipeline failed then the passThrough must be destroyed as the archiver does not handle the clean-up of the streams
        // If the passThrough is not destroyed, the uploadZipToS3 will hang waiting for the stream to end
        passThrough.destroy();
      }
    });

    const finalizePromise = zipper.finalize();

    const uploadPromise = uploadZipToS3(
      passThrough,
      `${event.modelId}-export-${event.exportProcessStateId}.zip`,
      getDownloadBucketRegion(),
      getDownloadBucketName()
    );

    await Promise.all([finalizePromise, uploadPromise]);
  } catch (e: unknown) {
    zipper.abort();
    const err = new Error("An error occurred while streaming data from the DB to the zip file on S3", { cause: e });
    console.error(err);
    throw err;
  } finally {
    // The zipper should be destroyed in either case, since the archiver doesn't autoDestroy its stream
    streamResources.forEach((resource) => resource.destroy());
  }

  // Set the export process status to COMPLETED
  const exportState = {
    downloadUrl: `https://${getDomainName()}/downloads/${event.modelId}-export-${event.exportProcessStateId}.zip`,
    status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
    result: {
      errored: false,
      exportErrors: ErrorLogger.errorCount > 0,
      exportWarnings: ErrorLogger.warningCount > 0,
    },
  };

  await getRepositoryRegistry().exportProcessState.update(event.exportProcessStateId, exportState);
  console.info("Export completed", exportState);
};

export const FILENAMES = {
  OccupationGroups: "occupation_groups.csv",
  Occupations: "occupations.csv",
  SkillGroups: "skill_groups.csv",
  Skills: "skills.csv",
  OccupationHierarchy: "occupation_hierarchy.csv",
  SkillHierarchy: "skill_hierarchy.csv",
  OccupationToSkillRelations: "occupation_to_skill_relations.csv",
  SkillToSkillRelations: "skill_to_skill_relations.csv",
  ModelInfo: "model_info.csv",
  License: "LICENSE",
};
