import { ObjectTypes } from "../GET/enums";
import type { ISkillParentItem } from "../GET/types";

namespace PATCHSkillParentsTypes {
  export namespace Request {
    export type Payload = {
      parentId: string;
      parentType: ObjectTypes;
    };
  }
  export namespace Response {
    export type Payload = ISkillParentItem | null;
  }
}

export default PATCHSkillParentsTypes;
