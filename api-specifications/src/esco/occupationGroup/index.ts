import OccupationGroupConstants from "./_shared/constants";
import OccupationGroupEnums from "./_shared/enums";
import OccupationGroupTypes from "./_shared/types";
import OccupationGroupRegexes from "./_shared/regex";
import SchemaOccupationGroupReference from "./_shared/schema.reference";

import OccupationGroupPOSTAPISpecs from "./POST/index";
import OccupationGroupGETAPISpecs from "./GET/index";
import OccupationGroupDetailAPISpecs from "./[id]/index";

namespace OccupationGroupAPISpecs {
  export import Enums = OccupationGroupEnums;
  export import Types = OccupationGroupTypes;
  export import Constants = OccupationGroupConstants;
  export import Patterns = OccupationGroupRegexes;

  // Shared, cross-endpoint schemas
  export namespace Schemas {
    export const Reference = SchemaOccupationGroupReference;
  }

  export import POST = OccupationGroupPOSTAPISpecs;
  export import GET = OccupationGroupGETAPISpecs;

  export import OccupationGroup = OccupationGroupDetailAPISpecs;
}

export default OccupationGroupAPISpecs;
