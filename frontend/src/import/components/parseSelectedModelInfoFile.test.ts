import parseSelectedModelInfoFile from "./parseSelectedModelInfoFile";

describe("parseSelectedModelInfoFile tests", () => {
  it("should parse UUIDHistory from a CSV file and return it as an array", async () => {
    // GIVEN a CSV file
    const testFileName = "test.csv";
    const testFileContent = 'Name,UUIDHistory\nJohn Doe,"UUID1\nUUID2\nUUID3"'; // Sample CSV content

    // AND the file is read into a File object
    const blob = new Blob([testFileContent], { type: "text/csv" });
    const file = new File([blob], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    const uuidHistory = await parseSelectedModelInfoFile(file);

    // THEN it should return the UUIDs as an array
    expect(uuidHistory).toEqual(["UUID1", "UUID2", "UUID3"]);
  });
  it("should throw an error if the file is not a CSV", async () => {
    // GIVEN a non-CSV file
    const testFileName = "test.json";
    const testFileContent = "This is not a CSV file";
    // AND the file is read into a File object
    const file = new File([testFileContent], testFileName, { type: "application/json" });

    // WHEN parseSelectedModelInfoFile is called with the file
    // THEN it should throw an error
    await expect(parseSelectedModelInfoFile(file)).rejects.toThrow("File is not a CSV");
  });

  it("should throw an error if the UUIDHistory column is not found or empty", async () => {
    // GIVEN a CSV file with no UUIDHistory column
    const testFileName = "test.csv";
    const testFileContent = "Name\nJohn Doe";
    // AND the file is read into a File object
    const file = new File([testFileContent], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    // THEN it should throw an error
    await expect(parseSelectedModelInfoFile(file)).rejects.toThrow("UUIDHistory column not found or empty");
  });
  it("should throw an error if the parser fails", async () => {
    // GIVEN a CSV file with invalid content
    const testFileName = "test.csv";
    const testFileContent = 'Name,UUIDHistory\nJohn Doe,"UUID1\nUUID2\nUUID3"';
    // AND GIVEN the parser will fail
    jest.spyOn(require("papaparse"), "parse").mockImplementation(() => {
      throw new Error("Error parsing the file");
    });
    // AND the file is read into a File object
    const file = new File([testFileContent], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    // THEN it should throw an error
    await expect(parseSelectedModelInfoFile(file)).rejects.toThrow("Error parsing the file");
  });
});
