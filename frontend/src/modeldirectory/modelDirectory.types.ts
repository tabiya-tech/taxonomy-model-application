export namespace ModelDirectoryTypes {
    export type Locale = {
      UUID: string
      shortCode: string
      name: string
    }

    export type ModelInfo = {
      id: string
      UUID: string
      previousUUID: string
      originUUID: string
      released: boolean
      releaseNotes: string
      version: string,
      name: string
      locale: Locale
      description: string
      path: string,
      tabiyaPath: string,
      createdAt: Date,
      updatedAt: Date
    }
}

