import { Readable } from "node:stream";
import { ObjectCounterTransform } from "./objectCounterTransform";

describe("ObjectCounterTransform", () => {
  test("should count objects processed by the transform", async () => {
    // GIVEN an array of objects
    const givenObjects = [{ data: "foo" }, { data: "bar" }, { data: "baz" }];
    const givenStream = Readable.from(givenObjects);

    // WHEN the stream is piped through the ObjectCounterTransform
    const objectCounterTransform = new ObjectCounterTransform();
    const actualStream = givenStream.pipe(objectCounterTransform);

    // AND the stream is consumed
    const processedObjects = [];
    for await (const actualObject of actualStream) {
      // THEN the counter transformation should count the objects and process them
      expect(objectCounterTransform.getObjectCount()).toEqual(givenObjects.length);
      processedObjects.push(actualObject);
    }
    // AND the number of processed objects should match the original objects
    expect(processedObjects).toHaveLength(givenObjects.length);
  });

  test("should handle errors when processing objects", async () => {
    // GIVEN a stream with a single object
    const givenObjects = { data: "foo" };
    const givenStream = Readable.from([givenObjects]);
    // AND a mock implementation that throws an error when pushing to the transform
    const objectCounterTransform = new ObjectCounterTransform();
    jest.spyOn(objectCounterTransform, "push").mockImplementation(() => {
      throw new Error("Mocked push error");
    });

    // WHEN the stream is piped through the ObjectCounterTransform
    const actualStream = givenStream.pipe(objectCounterTransform);

    // THEN consuming the stream should throw an error
    await expect(async () => {
      // AND iterate over the stream to consume it
      for await (const _ of actualStream) {
        // do nothing
      }
    }).rejects.toThrowError("Mocked push error");
  });
});
