import SkillConstants from "../_shared/constants";
import SkillEnums from "../_shared/enums";
import SkillTypes from "../_shared/types";

import GETSkillByIdOperation from "./GET";
import SkillParentsAPISpecs from "./parents";
import SkillChildrenAPISpecs from "./children";
import SkillOccupationsAPISpecs from "./occupations";
import SkillRelatedSkillsAPISpecs from "./relatedSkills";
import SkillHistoryAPISpecs from "./history";

namespace SkillInstanceAPISpecs {
  export import Constants = SkillConstants;
  export import Enums = SkillEnums;
  export namespace Types {
    export import GET = SkillTypes.Detail.GET;
  }

  export import GET = GETSkillByIdOperation;
  export import Parents = SkillParentsAPISpecs;
  export import Children = SkillChildrenAPISpecs;
  export import Occupations = SkillOccupationsAPISpecs;
  export import RelatedSkills = SkillRelatedSkillsAPISpecs;
  export import History = SkillHistoryAPISpecs;
}

export default SkillInstanceAPISpecs;
