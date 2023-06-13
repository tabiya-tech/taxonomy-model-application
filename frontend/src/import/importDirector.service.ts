import {ILocale} from 'api-specifications/modelInfo';
import ModelService from "./model/model.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import {ImportFileTypes, ImportFilePaths} from "api-specifications/import";
import {ImportFiles} from "./ImportFiles.type";

export default class ImportDirectorService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  async directImport(name: string, description: string, locale: ILocale, files: ImportFiles): Promise<string> {

    const modelService = new ModelService(this.apiServerUrl);
    const presignedService = new PresignedService(this.apiServerUrl);
    const [modelid, presigned] = await Promise.all(
      [modelService.createModel({name, description, locale}),
        presignedService.getPresignedPost()]);

    const uploadService = new UploadService();
    await uploadService.uploadFiles(presigned, Object.entries(files).map(([, file]) => file));
    const filesPaths: ImportFilePaths = {};
    Object.entries(files).forEach(([fileType, file]) => {
      filesPaths[fileType as ImportFileTypes] = `${presigned.folder}/${file.name}`;
    });
    const importService = new ImportService(this.apiServerUrl);
    await importService.import(modelid, filesPaths);
    return modelid;
  }

}