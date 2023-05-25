import {ImportRequest} from "api-specifications/import";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: ImportRequest): Promise<any> => {
  console.log(event);

  const result = await new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        msg: 'TO BE IMPLEMENTED',
        importRequest: event
      });
    }, 1000);
  });

  console.log(result);
};
