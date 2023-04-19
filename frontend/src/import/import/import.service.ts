import {getServiceErrorFactory} from "../../error/error";
import {ErrorCodes} from "../../error/errorCodes";


export default class ImportService {

  readonly apiServerUrl: string;
  readonly importEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.importEndpointUrl = `${apiServerUrl}/import`;
  }

  async import(modelid:string, fileUrls: string[]) {
    const errorFactory = getServiceErrorFactory("ImportService", "uploadFiles", "POST", this.importEndpointUrl);
    // TODO: implement
    // POST /import with payload {modelid:string, fileUrls: string[]}
  }
}