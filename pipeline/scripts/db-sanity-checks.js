
import { MongoClient } from 'mongodb';
import semver from "semver"

let job = process.argv[2];
let currentVersion = process.argv[3];
let dbURL = process.argv[4];

const assert = (failes, message) => {
  if(failes) {
    console.error(`❌ failed: ${message}`)
    process.exit(1)
  }
}

assert(!job, "job is required")
assert(!currentVersion, "currentVersion is required")
assert(!dbURL, "dbURL is required")
assert(!semver.valid(currentVersion.replace("v", "")), "currentVersion is not a valid semver version")

let client = new MongoClient(dbURL);
let _connection = client.connect();

async function close(){
  if(client){
    await client.close()
    process.exit(0)
  }
}

async function handler(){
  try {
    let connection = await _connection;
    let settingsCollection = await connection.db(client.db().databaseName).collection("meta");

    if(job === "save") {
      let tmpVersion = await settingsCollection.findOne({});

      if(!tmpVersion){
        await settingsCollection.insertOne({ version: currentVersion });
      } else {
        await settingsCollection.updateOne({}, {$set: {version: currentVersion}});
      }
    } else if(job === "assert") {

      let tmpVersion = await settingsCollection.findOne({});

      if(!tmpVersion){
        console.error("❌ tmp version not found")
        await close()
      }

      if(tmpVersion.version !== currentVersion){
        console.error("❌ a new version was deployed, please initialize the tests again before deployment")
        await close()
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    await close()
  }
}

handler().then(r => {
  console.log(" ✅ done")
}).catch(e => {
  console.error(e)
})
