import Papa from "papaparse";

interface CsvRow {
  UUIDHistory?: string;
}

const parseSelectedModelInfoFile = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // Check if the file is a CSV
    if (file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
      reject(new Error("File is not a CSV"));
      return;
    }

    Papa.parse<CsvRow>(file, {
      complete: (result) => {
        const records = result.data;

        // Check if the UUIDHistory column is found and not empty
        if (records.length === 0 || !records[0].UUIDHistory) {
          reject(new Error("UUIDHistory column not found or empty in the first row"));
          return;
        }

        // Split the UUIDHistory string into an array of UUIDs
        const uuidHistory: string[] = records[0].UUIDHistory.split("\n");
        resolve(uuidHistory);
      },
      error: (error) => reject(new Error("Error parsing the file: " + error.message)),
      header: true,
      skipEmptyLines: "greedy", // Skips empty lines
      // preview: 1, // Only parse the first row of actual data, ignoring the header
    });
  });
};

export default parseSelectedModelInfoFile;
