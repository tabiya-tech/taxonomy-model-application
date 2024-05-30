import semver from "semver"
import fetch from "node-fetch"

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

  if(semver.gt(_newVersion, _currentVersion)){
    console.log(`✅ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(0);
  } else {
    console.log(`❌ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(1);
  }
}

compareVersions(process.argv[2], process.argv[3])
