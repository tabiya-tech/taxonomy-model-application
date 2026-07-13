// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import EmbeddingsConstants from "./constants";
import EmbeddingModelSchema from "./schema";

/**
 * This file should be imported in the following way

 import EmbeddingsAPISpecs from "api-specifications/embeddings";

 * And the general pattern is EmbeddingsAPISpecs.{Constants/Schemas}.{...}
 *
 * NOTE: The API contract for /models/{modelId}/embedding-process-states (schemas, types, enums)
 * lives under modelInfo — see ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.
 * Only the embedding-model constants remain here.
 */

namespace EmbeddingsSchemas {
  export const EmbeddingModel = EmbeddingModelSchema;
}

namespace EmbeddingsAPISpecs {
  export import Constants = EmbeddingsConstants;
  export import Schemas = EmbeddingsSchemas;
}

export default EmbeddingsAPISpecs;
