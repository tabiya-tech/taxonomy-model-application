import OccupationEnums from "../../../_shared/enums";
import { SignallingValueLabel } from "../../../../common/objectTypes";

namespace POSTOccupationSkillsTypes {
  export namespace Request {
    export type Payload = {
      requiredSkillId: string;
      relationType: OccupationEnums.OccupationToSkillRelationType;
      signallingValueLabel: SignallingValueLabel;
      signallingValue?: number | null;
    };
  }
}

export default POSTOccupationSkillsTypes;
