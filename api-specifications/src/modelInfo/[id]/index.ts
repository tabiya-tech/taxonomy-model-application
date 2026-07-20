// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import EmbeddingProcessStatesAPISpecs from "./embeddingProcessStates";
import PATCHModelOperation from "./PATCH";

// Concept aggregator for [id] (ModelInfo Instance)
namespace ModelInfoInstanceAPISpecs {
  // Child API Paths
  export import EmbeddingProcessStates = EmbeddingProcessStatesAPISpecs;
  // Instance-level operations
  export import PATCH = PATCHModelOperation;
}

export default ModelInfoInstanceAPISpecs;
