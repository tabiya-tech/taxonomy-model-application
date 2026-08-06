import { SignallingValueLabel } from "../../../../common/objectTypes";
import SkillEnums from "../../../_shared/enums";
import OccupationTypes from "../../../../occupation/_shared/types";

namespace PATCHSkillOccupationsTypes {
  export namespace Request {
    export type Payload = {
      requiringOccupationId: string;
      relationType?: SkillEnums.OccupationToSkillRelationType;
      signallingValueLabel?: SignallingValueLabel;
      signallingValue?: number | null;
    };
  }
  export namespace Response {
    export type Payload = OccupationTypes.Response.IOccupation & {
      relationType: SkillEnums.OccupationToSkillRelationType | null;
      signallingValue: number | null;
      signallingValueLabel: SignallingValueLabel | null;
    };
  }
}

export default PATCHSkillOccupationsTypes;
