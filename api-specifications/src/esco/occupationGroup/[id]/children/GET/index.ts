import OccupationGroupChildrenGETTypes from "./types";
import GETOccupationGroupChildrenEnums from "./enums";
import OccupationGroupChildrenGETConstants from "./constants";
import SchemaGETResponseChild from "./schema.child.response";
import SchemaGETChildrenResponse from "./schema.children.response";

namespace OccupationGroupChildrenSchemas {
  export namespace Response {
    export namespace Child {
      export const Payload = SchemaGETResponseChild;
    }
    export namespace Children {
      export const Payload = SchemaGETChildrenResponse;
    }
  }
}

namespace OccupationGroupChildrenAPISpecs {
  export import Constants = OccupationGroupChildrenGETConstants;
  export import Enums = GETOccupationGroupChildrenEnums;
  export import Types = OccupationGroupChildrenGETTypes;
  export import Schemas = OccupationGroupChildrenSchemas;
}
export default OccupationGroupChildrenAPISpecs;
