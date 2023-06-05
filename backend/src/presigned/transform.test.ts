import {transformPostData} from "./transform";
import {IPresignedResponse} from "api-specifications/presigned";
import {PresignedPost} from "@aws-sdk/s3-presigned-post";

describe("test the transformPostData()", () => {

  it("should successfully transform", async () => {
    // GIVEN a post data
    const givenPostData: PresignedPost = {
      url: "some/url",
      fields: {"key": "foo", "key1": "value1", "key2": "value2"}
    }
    // AND a folder
    const folder = "bar";
    // WHEN the transformPostData() is called with the given post data
    const actualPostData: IPresignedResponse = transformPostData(givenPostData, folder);

    // THEN expect to return IPreSignedResponse
    expect(actualPostData).toMatchObject({
      url: givenPostData.url,
      folder: folder,
      fields: [{name: "key1", value: "value1"}, {name: "key2", value: "value2"}]
    })
  });
});