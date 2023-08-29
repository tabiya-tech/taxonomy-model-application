export interface IPresignedResponse {
  url: string,
  fields: {name: string, value: string}[],
  folder: string,
}
