import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";

export const parseModelToFile = async (exportProcessStateId: string) => {
  // Main logic to update ExportProcessState
  // This is where the exporting of the db to CSV and zipping and uploading will happen
  const exportState = {
    status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
    result: {
      errored: false,
      // checking parsing errors and warning is an upcoming feature
      exportErrors: false,
      exportWarnings: false,
    },
    downloadUrl: "https://download-bucket-1f37870.s3.eu-central-1.amazonaws.com/greet.zip",
  };
  await getRepositoryRegistry().exportProcessState.update(exportProcessStateId, exportState);
  console.info("Export completed", exportState);
};
