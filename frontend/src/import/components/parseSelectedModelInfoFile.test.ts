import parseSelectedModelInfoFile from "./parseSelectedModelInfoFile";

describe("parseSelectedModelInfoFile tests", () => {
  it("should parse UUIDHISTORY from a CSV file and return it as an array", async () => {
    // GIVEN a CSV file
    const testFileName = "test.csv";
    const testFileContent = 'Name,UUIDHISTORY\nJohn Doe,"UUID1\nUUID2\nUUID3"'; // Sample CSV content

    // AND the file is read into a File object
    const blob = new Blob([testFileContent], { type: "text/csv" });
    const file = new File([blob], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    const parsedFile = await parseSelectedModelInfoFile(file);

    // THEN it should return the UUIDs as an array
    expect(parsedFile.UUIDHistory).toEqual(["UUID1", "UUID2", "UUID3"]);

    // AND description should be empty
    expect(parsedFile.description).toEqual("");
  });

  it("should parse description from a CSV file and return it as a string", async () => {
    // GIVEN a CSV file with a description
    const givenDescription = "This is a description";
    const givenUUIDHistory = ["UUID1", "UUID2", "UUID3"];
    const testFileName = "test.csv";
    const testFileContent = `Name,UUIDHISTORY,DESCRIPTION\nJohn Doe,"${givenUUIDHistory.join(
      "\n"
    )}","${givenDescription}"`; // Sample CSV content

    // AND the file is read into a File object
    const blob = new Blob([testFileContent], { type: "text/csv" });
    const file = new File([blob], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    const { description, UUIDHistory } = await parseSelectedModelInfoFile(file);

    // THEN it should return the description as a string
    expect(description).toEqual(givenDescription);

    // AND UUIDHistory should be an empty array
    expect(UUIDHistory).toEqual(givenUUIDHistory);
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

  it("should throw an error if the UUIDHISTORY column is not found or empty", async () => {
    // GIVEN a CSV file with no UUIDHistory column
    const testFileName = "test.csv";
    const testFileContent = "Name\nJohn Doe";
    // AND the file is read into a File object
    const file = new File([testFileContent], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    // THEN it should throw an error
    await expect(parseSelectedModelInfoFile(file)).rejects.toThrow("UUIDHISTORY column not found or empty");
  });
  it("should throw an error if the parser fails", async () => {
    // GIVEN a CSV file with invalid content
    const testFileName = "test.csv";
    const testFileContent = 'Name,UUIDHISTORY\nJohn Doe,"UUID1\nUUID2\nUUID3"';
    // AND GIVEN the parser will fail
    jest.spyOn(require("papaparse"), "parse").mockImplementation((file, config: unknown) => {
      const mockError = { message: "Mock error during parsing" };
      // @ts-ignore
      config.error(mockError);
    });
    // AND the file is read into a File object
    const file = new File([testFileContent], testFileName, { type: "text/csv" });

    // WHEN parseSelectedModelInfoFile is called with the file
    // THEN it should throw an error
    await expect(parseSelectedModelInfoFile(file)).rejects.toThrow("Error parsing the file");
  });
});
