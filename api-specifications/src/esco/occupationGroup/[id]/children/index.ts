import SchemaGETResponseChild from "./schema.child.response";
import SchemaGETChildrenResponse from "./schema.children.response";
import OccupationGroupChildrenGETConstants from "./constants";
import OccupationGroupChildrenGETTypes from "./types";
import GETOccupationGroupChildrenEnums from "./enums";

namespace OccupationGroupGETChildrenSchemas {
  export namespace Response {
    export namespace Child {
      export const Payload = SchemaGETResponseChild;
    }
    export namespace Children {
      export const Payload = SchemaGETChildrenResponse;
    }
  }
}

namespace OccupationGroupGETChildrenAPISpecs {
  export import Schemas = OccupationGroupGETChildrenSchemas;
  export import Types = OccupationGroupChildrenGETTypes;
  export import Enums = GETOccupationGroupChildrenEnums;
  export import Constants = OccupationGroupChildrenGETConstants;
}

export default OccupationGroupGETChildrenAPISpecs;
