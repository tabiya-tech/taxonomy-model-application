import semver from "semver"
import fetch from "node-fetch"

/**
 * Format version to remove the 'v' prefix
 * @param version the version to format
 * @returns {string} the formatted version
 */
const formatVersion = (version) => {
  if(version.startsWith('v')) {
    return version.replace("v", "");
  }

  return version;
}

/**
 * Compare the new version with the current version
 * @param newVersion the new version
 * @param url the url to fetch the current version (this should return a json with a 'version' key)
 */
async function compareVersions(newVersion, url){
  // let _newVersion = formatVersion(newVersion);
  //
  // // Fetch the current version
  // let { version: currentVersion } = await fetch(url).then(res => res.json());
  //
  // let _currentVersion = formatVersion(currentVersion);
  //
  // // Compare the versions
  // if(semver.gte(_newVersion, _currentVersion)){
  //   console.log(`✅ New version ${newVersion}, current version ${currentVersion}`);
  //   process.exit(0);
  // } else {
  //   console.log(`❌ New version ${newVersion}, current version ${currentVersion}`);
  //   process.exit(1);
  // }
}

compareVersions(process.argv[2], process.argv[3])
