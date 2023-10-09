import { transformPresignedPostDataToResponse } from "./transform";
import PresignedAPISpecs from "api-specifications/presigned";
import { PresignedPost } from "@aws-sdk/s3-presigned-post";

describe("test the transformPresignedPostDataToResponse()", () => {
  it("should successfully transform", async () => {
    // GIVEN some presigned post data
    const givenPresignedPostData: PresignedPost = {
      url: "some/url",
      fields: { key: "foo", key1: "value1", key2: "value2" },
    };
    // AND a folder
    const givenFolder = "bar";

    // WHEN the transformPresignedPostDataToResponse function is called with the given presigned post data
    const actualPresignedResponse: PresignedAPISpecs.Types.GET.Response.Payload = transformPresignedPostDataToResponse(
      givenPresignedPostData,
      givenFolder
    );

    // THEN expect the function to return a correct IPreSignedResponse
    expect(actualPresignedResponse).toEqual({
      url: givenPresignedPostData.url,
      folder: givenFolder,
      fields: [
        { name: "key1", value: "value1" },
        { name: "key2", value: "value2" },
      ],
    });
  });
});
