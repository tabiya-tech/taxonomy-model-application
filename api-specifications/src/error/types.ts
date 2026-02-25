import ImportAPI from "../import";
import ExportAPI from "../export";
import ModelInfo from "../modelInfo";
import ErrorConstants from "./constants";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";
import SkillGroupAPI from "../esco/skillGroup";
import { StatusCodes } from "http-status-codes";
import SkillsAPI from "../esco/skill";

namespace ErrorTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export interface Payload {
    errorCode:
      | ErrorConstants.ErrorCodes
      | ImportAPI.Enums.POST.Response.ImportResponseErrorCodes
      | ExportAPI.Enums.POST.Response.ExportResponseErrorCodes
      | ModelInfo.Enums.POST.Response.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status400.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status404.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Skills.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Skills.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Skills.ErrorCodes
      | ModelInfo.Enums.GET.Response.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status500.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.RelatedSkills.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.RelatedSkills.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.RelatedSkills.ErrorCodes;
    message: string; // The error message offers better developer experience. UI should not display this message.
    details: string; // This may be some cryptic message only a developer can understand
  }

  export interface GenericPayload<ErrorCode> {
    errorCode: ErrorCode;
    message: string; // The error message offers better developer experience. UI should not display this message.
    details: string; // This may be some cryptic message only a developer can understand
  }

  export interface GetPayload {
    errorCode: string;
    message: string;
    details: string;
  }
  export interface POST {
    errorCode:
      | ErrorConstants.Common.ErrorCodes
      | ErrorConstants.POST.ErrorCodes
      | ImportAPI.Enums.POST.Response.ImportResponseErrorCodes
      | ExportAPI.Enums.POST.Response.ExportResponseErrorCodes
      | ModelInfo.Enums.POST.Response.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status400.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status404.ErrorCodes
      | OccupationAPI.Enums.POST.Response.Status500.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillsAPI.Enums.POST.Response.Status500.ErrorCodes;
    message: string;
    details: string;
  }
  export interface GET {
    errorCode:
      | ErrorConstants.Common.ErrorCodes
      | ErrorConstants.GET.ErrorCodes
      | ModelInfo.Enums.GET.Response.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status400.Skills.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status404.Skills.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Parent.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Children.ErrorCodes
      | OccupationAPI.Enums.GET.Response.Status500.Skills.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status400.RelatedSkills.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status404.RelatedSkills.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Parents.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Children.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.Occupations.ErrorCodes
      | SkillsAPI.Enums.GET.Response.Status500.RelatedSkills.ErrorCodes;
    message: string;
    details: string;
  }
  export interface PATCH {
    errorCode: ErrorConstants.Common.ErrorCodes | ErrorConstants.PATCH.ErrorCodes;
    message: string;
    details: string;
  }

  export type Codes = StatusCodes;
  export type METHODS = "POST" | "GET" | "PATCH" | "PUT" | "DELETE" | "ALL";
}
export default ErrorTypes;
