// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import EmbeddingProcessStatesEnums from "./enums";
import POSTEmbeddingProcessStatesOperation from "./POST";

// Concept aggregator for the embedding process states of a model
namespace EmbeddingProcessStatesAPISpecs {
  export import Enums = EmbeddingProcessStatesEnums;

  export import POST = POSTEmbeddingProcessStatesOperation;
}

export default EmbeddingProcessStatesAPISpecs;
