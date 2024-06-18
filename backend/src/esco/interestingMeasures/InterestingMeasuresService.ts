import mongoose from "mongoose";
import { Readable } from "node:stream";
import { BatchProcessor } from "import/batch/BatchProcessor";
import stream, { Transform, TransformCallback } from "stream";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { ISkillDoc } from "esco/skill/skills.types";
import { IOccupationToSkillRelationPairDoc } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import {IOccupationDoc} from "../occupations/occupation.types";

/**
 * Describes how degree centrality is calculated for a skill
 */
export interface ISkillConnection {
  skillId: string;
  edges: number;
  interOccupationTransferability: number;
}

export class InterestingMeasuresService {
  SkillModel: mongoose.Model<ISkillDoc>;
  OccupationModel: mongoose.Model<IOccupationDoc>;
  OccupationToSkillRelationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>;

  constructor(
    SkillModel: mongoose.Model<ISkillDoc>,
    OccupationModel: mongoose.Model<IOccupationDoc>,
    OccupationToSkillRelationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>
  ) {
    this.SkillModel = SkillModel;
    this.OccupationModel = OccupationModel;
    this.OccupationToSkillRelationModel = OccupationToSkillRelationModel;
  }

  /**
   * Updates the degree centrality of the skills.
   * @param {ISkillConnection[]} skillConnections a list of objects that contain a skill and the total number of edges of that skill
   */
  async updateSkillDegreeCentrality(skillConnections: ISkillConnection[]): Promise<RowsProcessedStats> {
    try {
      const response = await this.SkillModel.bulkWrite(
        skillConnections.map((skill) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(skill.skillId) },
            update: {
              $set: {
                interOccupationTransferability: skill.interOccupationTransferability,
                degreeCentrality: skill.edges,
              },
            },
          },
        }))
      );

      return {
        rowsFailed:
          response.modifiedCount === skillConnections.length ? 0 : skillConnections.length - response.modifiedCount,
        rowsSuccess: response.modifiedCount,
        rowsProcessed: skillConnections.length,
      };
    } catch (e) {
      const err = new Error("DegreeCentralityService.updateSkillDegreeCentrality: bulkWrite failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getTotalNumberOfOccupations (modelId: string): Promise<number> {
    return this.OccupationModel.countDocuments({ modelId: { $eq: modelId } });
  }

  /**
   * Counts the number of OccupationToSkillRelation entries that have the given skillId.
   * @param {string} modelId - The modelId of the occupations.
   * @param totalOccupations
   * @returns {Readable} - A Readable stream of objects with the skillId and the total number of connections (edges).
   *
   * Rejects with an error if the operation fails.
   */
  aggregateDegreeCentralityData(modelId: string, totalOccupations: number): Readable {
    try {
      const skillConnectionsMap = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.OccupationToSkillRelationModel.aggregate([
          { $match: { modelId: new mongoose.Types.ObjectId(modelId) } },
          { $group: { _id: "$requiredSkillId", edges: { $sum: 1 } } },
          { $project: { _id: 0, skillId: { $toString: "$_id" }, edges: 1 } },
        ]).cursor(),
        new Transform({
          objectMode: true,
          transform(chunk: ISkillConnection, _encoding: BufferEncoding, callback: TransformCallback) {
            callback(null, {
              ...chunk,
              // calculate the inter-occupation transferability
              interOccupationTransferability: chunk.edges / totalOccupations,
            });
          },
        }),
        () => undefined
      );
      skillConnectionsMap.on("error", (e) => {
        console.error(new Error("DegreeCentralityService.updateSkillDegreeCentrality: stream failed", { cause: e }));
      });

      return skillConnectionsMap;
    } catch (e) {
      const err = new Error("DegreeCentralityService.updateSkillDegreeCentrality: aggregate failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async calculate(modelId: string) {
    console.info("Calculating degree centrality for modelId: ", modelId);

    try {
      const BATCH_SIZE = 1000;
      const TOTAL_OCCUPATIONS = await this.getTotalNumberOfOccupations(modelId);

      // step 1: streaming connections
      const skillConnectionsMap = this.aggregateDegreeCentralityData(modelId, TOTAL_OCCUPATIONS);

      // step 2: updating skills.
      // Because the update operation is asynchronous, we need to use a batch processor to handle the updates.
      // also because this function will be called in another class we need to bind the function to the class
      const batchProcessor = new BatchProcessor<ISkillConnection>(
        BATCH_SIZE,
        this.updateSkillDegreeCentrality.bind(this)
      );

      for await (const skillConnection of skillConnectionsMap) {
        await batchProcessor.add(skillConnection);
      }

      await batchProcessor.flush();

      const stats = batchProcessor.getStats();

      console.info(stats);
    } catch (e) {
      const err = new Error("DegreeCentralityService.calculateDegreeCentrality findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
