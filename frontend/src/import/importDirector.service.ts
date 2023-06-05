import {ILocale} from 'api-specifications/modelInfo';
import ModelService from "./model/model.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import {ImportFileTypes} from "api-specifications/import";

export default class ImportDirectorService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  async directImport(name: string, description: string, locale: ILocale, files: { fileType: ImportFileTypes,file: File }[]): Promise<string> {

    const modelService = new ModelService(this.apiServerUrl);
    const presignedService = new PresignedService(this.apiServerUrl);
    const [modelid, presigned] = await Promise.all(
      [modelService.createModel({name, description, locale}),
        presignedService.getPresignedPost()]);

    const uploadService = new UploadService();
    await uploadService.uploadFiles(presigned, files.map(file => file.file));
    const filesPaths: {[key in ImportFileTypes]: string} = {} as any;
    files.forEach(file => {
        filesPaths[file.fileType] = `${presigned.folder}/${file.file.name}`;
    });
    const importService = new ImportService(this.apiServerUrl);
    await importService.import(modelid,filesPaths);
    return modelid;
  }

}