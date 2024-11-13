import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { arrayFromString, stringFromArray } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

function addUUID(sourceFolder: string, file: string, targetFolder: string, field: string = "UUIDHISTORY") {
  // parse the csv file synchronously and add the preferred label if it is missing from the altlabels list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputPath = path.resolve(path.join(sourceFolder, file));
  const data = parse(fs.readFileSync(inputPath), { columns: true }).map((row: Record<string, string>) => {
    const uuids = arrayFromString(row[field]);
    // add a new UUID at the beginning of the list
    const uuid = randomUUID(); // generate a new UUID
    uuids.unshift(uuid);
    row[field] = stringFromArray(uuids);
    return row;
  });
  // create the target folder if it does not exist
  fs.mkdirSync(targetFolder, { recursive: true });
  // write the data back to the disk using name ".bak"
  const outputPath = path.resolve(path.join(targetFolder, file));
  fs.writeFileSync(outputPath, stringify(data, { header: true, quoted_string: true }));
}

function createBaseModel({ source, destination }: { source: string; destination: string }) {
  addUUID(source, "skills.csv", destination);
  addUUID(source, "model_info.csv", destination, "UUIDHistory");
  addUUID(source, "occupations.csv", destination);
  addUUID(source, "skill_groups.csv", destination);
  addUUID(source, "occupation_groups.csv", destination);
}

createBaseModel({
  source: "/path/to/source/folder",
  destination: "/path/to/destination/folder/",
});
