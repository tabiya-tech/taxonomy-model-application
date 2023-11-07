export namespace ExportProcessStateEnums {
  export enum Status {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
  }
}

export namespace ExportProcessState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import Enums = ExportProcessStateEnums;
}
export default ExportProcessStateEnums;
