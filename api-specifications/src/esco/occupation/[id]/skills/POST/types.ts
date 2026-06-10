import OccupationEnums from "../../../_shared/enums";
import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillTypes from "../../../../skill/_shared/types";

namespace POSTOccupationSkillsTypes {
  export namespace Request {
    export type Payload = {
      requiredSkillId: string;
      relationType: OccupationEnums.OccupationToSkillRelationType;
      signallingValueLabel: SignallingValueLabel;
      signallingValue?: number | null;
    };
  }
  export namespace Response {
    export type Payload = SkillTypes.Response.ISkill & {
      relationType: OccupationEnums.OccupationToSkillRelationType | null;
      signallingValue: number | null;
      signallingValueLabel: SignallingValueLabel | null;
    };
  }
}

export default POSTOccupationSkillsTypes;
