import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillEnums from "../../../_shared/enums";

namespace POSTSkillOccupationsTypes {
  export namespace Request {
    export type Payload = {
      requiringOccupationId: string;
      relationType: SkillEnums.OccupationToSkillRelationType;
      signallingValueLabel: SignallingValueLabel;
      signallingValue?: number | null;
    };
  }
}

export default POSTSkillOccupationsTypes;
