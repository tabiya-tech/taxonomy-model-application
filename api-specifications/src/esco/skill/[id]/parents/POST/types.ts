import { ObjectTypes } from "../GET/enums";

namespace POSTSkillParentsTypes {
  export namespace Request {
    export type Payload = {
      parentId: string;
      parentType: ObjectTypes;
    };
  }
}

export default POSTSkillParentsTypes;
