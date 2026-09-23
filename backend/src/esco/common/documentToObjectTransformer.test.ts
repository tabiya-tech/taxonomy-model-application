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

  test("should pass the given options to the toObject method", async () => {
    // GIVEN a document with a toObject method
    const givenDocument = {
      toObject: jest.fn().mockReturnValue({ foo: "foo" }),
    };
    // AND a stream containing the document
    const givenDocumentsStream = Readable.from([givenDocument]);
    // AND some toObject options
    const givenOptions = { virtuals: true, transform: jest.fn() };

    // WHEN the stream is piped to a transformer created with the options
    const actualStream = givenDocumentsStream.pipe(new DocumentToObjectTransformer(givenOptions));
    // AND it is consumed
    const actualObjects = [];
    for await (const actualObject of actualStream) {
      actualObjects.push(actualObject);
    }

    // THEN expect the transformed object to be returned
    expect(actualObjects).toEqual([{ foo: "foo" }]);
    // AND the document to have been transformed with the given options
    expect(givenDocument.toObject).toHaveBeenCalledWith(givenOptions);
  });

  test("should call callback with error toObject method throws an error", async () => {
    // GIVEN a document with a toObject method that throws an error
    const givenDocument = {
      toObject: jest.fn().mockImplementation(() => {
        throw new Error("Mocked toObject error");
      }),
    };
    // AND a stream containing the document
    const givenDocumentsStream = Readable.from([givenDocument]);

    // WHEN the stream is piped to the transformer
    const actualStream = givenDocumentsStream.pipe(new DocumentToObjectTransformer());

    // THEN expect the stream to throw an error
    await expect(async () => {
      // AND iterate over the stream to consume it
      for await (const _ of actualStream) {
        // do nothing
      }
    }).rejects.toThrowError("Mocked toObject error");
    // AND ensure that the toObject method was called
    expect(givenDocument.toObject).toHaveBeenCalled();
  });
});
