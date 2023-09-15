import {mapFileTypeToName} from "./mapFileTypeToName";
import ImportAPISpecs from "api-specifications/import";

describe("mapFileTypeToName test only", () => {
  it("should successfully convert all known filetypes to readable text", () => {
    // GIVEN all known fileTypes
    const givenAllKnownFileTypes = Object.values(ImportAPISpecs.Constants.ImportFileTypes);

    // WHEN the mapFileTypeToName is called for each of the known fileType
    const seenResults = [];
    for (const known of givenAllKnownFileTypes) {
      const result = mapFileTypeToName(known);

      // THEN expect knownResult to be unique
      expect(seenResults).not.toContain(result);
      // AND expect the result to be different from Unknown File Type
      expect(result).not.toBe("Unknown File Type");
      // AND expect to be defined
      expect(result).toBeDefined();
      // AND expect result not be empty
      expect(result).not.toBe("")
      seenResults.push(result);
    }
  })

  it("should return an Unknown File Type", () => {
    // GIVEN an invalid fileType
    const giveFileType = "foo";

    // WHEN mapFileTypeToName is called with invalid fileType expect Unknown File Type
    // @ts-ignore
    const result = mapFileTypeToName(giveFileType);

    // THEN expect Unknown File Type
    const expectedError = "Unknown File Type";
    expect(result).toBe(expectedError);
  })
})