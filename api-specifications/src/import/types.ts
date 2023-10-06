import ImportConstants from "./constants";

export interface IImportRequest {
  modelId: string;
  filePaths: ImportTypes.POST.Request.ImportFilePaths;
}

namespace ImportTypes {
  export namespace POST {
    export namespace Request {
      export type Payload = IImportRequest;
      export type ImportFilePaths = {
        [key in ImportConstants.ImportFileTypes]?: string;
      };
    }
  }
}

export default ImportTypes;
