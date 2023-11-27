import { DocumentToObjectTransformer } from "./documentToObjectTransformer";
import { Readable } from "node:stream";

describe("documentToObjectTransformer", () => {
  test("should transform a document to an object", async () => {
    // GIVEN a document with a toObject method
    const givenDocument = {
      toObject: jest.fn().mockReturnValue({ foo: "foo" }),
    };
    // AND a stream containing the document
    const givenDocumentsStream = Readable.from([givenDocument]);

    // WHEN the stream is piped to the transformer
    const actualStream = givenDocumentsStream.pipe(new DocumentToObjectTransformer());
    // AND it is consumed
    //  iterate over the stream to consume it
    for await (const actualObject of actualStream) {
      // THEN it should return the transformed object
      expect(actualObject).toEqual({ foo: "foo" });
    }

    // AND the document should have been transformed
    //  assert that the document was transformed as a guard in case the for await loop is not entered
    expect(givenDocument.toObject).toHaveBeenCalled();
  });
  test.todo("should call callback with error toObject method throws an error");
});
