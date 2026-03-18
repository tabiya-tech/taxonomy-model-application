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
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status400.ErrorCodes
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status404.ErrorCodes
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status400.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status404.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status500.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status500.ErrorCodes
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
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status400.ErrorCodes
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status404.ErrorCodes
      | OccupationGroupAPI.POSTAPISpecs.Enums.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status400.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status404.ErrorCodes
      | OccupationAPI.POSTOccupation.Errors.Status500.ErrorCodes
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
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETAPISpecs.Enums.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETDetailAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETChildrenAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status400.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status404.ErrorCodes
      | OccupationGroupAPI.GETDetailAPISpecs.GETParentAPISpecs.Enums.GET.Response.Status500.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes
      | SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status400.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status404.ErrorCodes
      | OccupationAPI.GETOccupations.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.parent.GET.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.children.GET.Errors.Status500.ErrorCodes
      | OccupationAPI.Detail.skills.GET.Errors.Status500.ErrorCodes
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
