namespace InfoTypes {
  export namespace GET {
    export namespace Response {
      export type Payload = {
        date: string;
        branch: string;
        buildNumber: string;
        sha: string;
        path: string;
        database: string;
      };
    }
  }
}

export default InfoTypes;
