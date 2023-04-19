import {ILocale} from 'api-specifications/modelInfo';
import ModelService from "./model/model.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";

export default class ImportDirectorService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  async directImport(name: string, description: string, locale: ILocale, files: File[]) {

    const modelService = new ModelService(this.apiServerUrl);
    const presignedService = new PresignedService(this.apiServerUrl);
    const [modelid, presigned] = await Promise.all(
      [modelService.createModel({name, description, locale}),
        presignedService.getPresignedPost()]);

    const uploadService = new UploadService();
    await uploadService.uploadFiles(presigned, files);
    return modelid;
  }

}