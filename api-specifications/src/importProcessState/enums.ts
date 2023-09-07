export namespace ImportProcessStateEnums {
  export enum Status {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
  }
}

export namespace ImportProcessState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import Enums = ImportProcessStateEnums;
}
export default ImportProcessStateEnums;