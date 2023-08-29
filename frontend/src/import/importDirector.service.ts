import Locale from "api-specifications/locale"
import ModelInfoService from "src/modelInfo/modelInfo.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import Import, {Constants as ImportConstants} from "api-specifications/import";
import {ImportFiles} from "./ImportFiles.type";
import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";

export default class ImportDirectorService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  async directImport(name: string, description: string, locale: Locale.Payload, files: ImportFiles): Promise<ModelInfoTypes.ModelInfo> {

    const modelService = new ModelInfoService(this.apiServerUrl);
    const presignedService = new PresignedService(this.apiServerUrl);
    const [newModel, presigned] = await Promise.all(
      [modelService.createModel({name, description, locale}),
        presignedService.getPresignedPost()]);

    const uploadService = new UploadService();
    await uploadService.uploadFiles(presigned, Object.entries(files).map(([, file]) => file));
    const filesPaths: Import.POST.Request.ImportFilePaths = {};
    Object.entries(files).forEach(([fileType, file]) => {
      filesPaths[fileType as ImportConstants.ImportFileTypes] = `${presigned.folder}/${file.name}`;
    });
    const importService = new ImportService(this.apiServerUrl);
    await importService.import(newModel.id, filesPaths);
    return newModel;
  }

}