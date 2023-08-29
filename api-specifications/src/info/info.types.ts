interface IInfoResponse {
    date: string,
    branch: string,
    buildNumber: string,
    sha: string,
    path: string,
    database:string,
}

namespace InfoTypes {
    export namespace GET {
        export namespace Response {
            export type Payload = IInfoResponse;
        }
    }
}

export default InfoTypes;