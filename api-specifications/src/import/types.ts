import ImportConstants from "./constants";

export interface IImportRequest {
  modelId: string;
  filePaths: ImportTypes.POST.Request.ImportFilePaths;
  isOriginalESCOModel: boolean;
}

namespace ImportTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

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
