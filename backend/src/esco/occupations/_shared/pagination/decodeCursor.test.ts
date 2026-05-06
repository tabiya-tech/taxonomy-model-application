import { decodeCursor } from "./decodeCursor";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("decodeCursor unit tests", () => {
  test("should decode a valid base64 cursor", () => {
    const id = getMockStringId(1);
    const createdAt = new Date().toISOString();
    const cursor = Buffer.from(JSON.stringify({ id, createdAt })).toString("base64");
    const result = decodeCursor(cursor);
    expect(result.id).toBe(id);
    expect(result.createdAt.toISOString()).toBe(createdAt);
  });

  test("should throw error for invalid json in cursor", () => {
    const cursor = Buffer.from("invalid-json").toString("base64");
    expect(() => decodeCursor(cursor)).toThrow();
  });
});
