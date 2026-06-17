import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillEnums from "../../../_shared/enums";
import type { ISkillOccupationItem } from "../GET/types";

namespace POSTSkillOccupationsTypes {
  export namespace Request {
    export type Payload = {
      requiringOccupationId: string;
      relationType?: SkillEnums.OccupationToSkillRelationType;
      signallingValueLabel?: SignallingValueLabel;
      signallingValue?: number | null;
    };
  }
  export namespace Response {
    export type Payload = ISkillOccupationItem;
  }
}

export default POSTSkillOccupationsTypes;
