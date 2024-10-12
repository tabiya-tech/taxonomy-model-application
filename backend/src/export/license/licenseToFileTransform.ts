import { Readable } from "node:stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

const LicenseToFileTransform = async (modelId: string): Promise<Readable> => {
  const modelInfo = await getRepositoryRegistry().modelInfo.getModelById(modelId);

  if (!modelInfo) {
    throw new Error("ModelInfo not found");
  }

  // return a pipeline with one string.
  return Readable.from([modelInfo.license]);
};

export default LicenseToFileTransform;
