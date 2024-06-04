import semver from "semver"
import fetch from "node-fetch"

// Remove the 'v' prefix if it exists
const formatVersion = (version) => {
  if(version.startsWith('v')) {
    return version.replace("v", "");
  }
  return version;
}

async function compareVersions(newVersion, url){
  let _newVersion = formatVersion(newVersion);

  let { version: currentVersion } = await fetch(url).then(res => res.json());

  let _currentVersion = formatVersion(currentVersion);

  // Compare the versions, and if the old version is less than the new version, exit with 0
  if(semver.gt(_newVersion, _currentVersion)){
    console.log(`✅ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(0);
  } else {
    console.log(`❌ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(1);
  }
}

// The first argument is the new version
// The second argument is the url to fetch the current version
// Both are received from the GitHub Actions workflow
compareVersions(process.argv[2], process.argv[3])
