import LocaleAPISpecs from "api-specifications/locale";
import LanguageAPISpecs from "api-specifications/language";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import ImportAPISpecs from "api-specifications/import";
import { ImportFiles } from "./ImportFiles.type";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

export default class ImportDirectorService {
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
  }

  async directImport(
    name: string,
    description: string,
    license: string,
    locale: LocaleAPISpecs.Types.Payload,
    files: ImportFiles,
    UUIDHistory: string[],
    availableLanguages: string[],
    isOriginalESCOModel: boolean
  ): Promise<ModelInfoTypes.ModelInfo> {
    // When the model_info.csv file does not declare the languages, the model is created with the fall back language
    // of the registry, so that the languages the model carries data in are always sent to the backend.
    const modelLanguages =
      availableLanguages.length > 0 ? availableLanguages : [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode];
    const modelService = new ModelInfoService(this.apiServerUrl);
    const presignedService = new PresignedService(this.apiServerUrl);
    const [newModel, presigned] = await Promise.all([
      modelService.createModel({
        name,
        description,
        locale,
        UUIDHistory,
        license,
        availableLanguages: modelLanguages,
      }),
      presignedService.getPresignedPost(),
    ]);

    const uploadService = new UploadService();
    await uploadService.uploadFiles(
      presigned,
      Object.entries(files).map(([, file]) => file)
    );
    const filesPaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths = {};
    Object.entries(files).forEach(([fileType, file]) => {
      filesPaths[fileType as ImportAPISpecs.Constants.ImportFileTypes] = `${presigned.folder}/${file?.name}`;
    });
    const importService = new ImportService(this.apiServerUrl);
    await importService.import(newModel.id, filesPaths, isOriginalESCOModel);
    return newModel;
  }
}
