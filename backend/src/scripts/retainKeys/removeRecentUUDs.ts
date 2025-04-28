import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { arrayFromString, stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

type Params = {
  source: string;
  destination: string;
};

function removeRecentUUID(sourceFolder: string, file: string, targetFolder: string, field: string = "UUIDHISTORY") {
  // parse the csv file synchronously and add the preferred label if it is missing from the altlabels list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputPath = path.resolve(path.join(sourceFolder, file));
  const data = parse(fs.readFileSync(inputPath), { columns: true }).map((row: Record<string, string>) => {
    const uuids = arrayFromString(row[field]);
    // Remove the UUID from the beginning of the list
    uuids.shift();
    row[field] = stringFromArray(uuids);
    return row;
  });

  // create the target folder if it does not exist
  fs.mkdirSync(targetFolder, { recursive: true });
  // write the data back to the disk using name ".bak"
  const outputPath = path.resolve(path.join(targetFolder, file));
  fs.writeFileSync(outputPath, stringify(data, { header: true, quoted_string: true }));
}

async function removeRecentUUIDsFromModel({ source, destination }: Params) {
  removeRecentUUID(source, "skills.csv", destination);
  removeRecentUUID(source, "model_info.csv", destination, "UUIDHistory");
  removeRecentUUID(source, "occupations.csv", destination);
  removeRecentUUID(source, "skill_groups.csv", destination);
  removeRecentUUID(source, "occupation_groups.csv", destination);
}

removeRecentUUIDsFromModel({
  source: "/path/to/source/model",
  destination: "/path/to/destination/model",
}).catch(console.error);
