import { exec } from "child_process"
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

async function getCurrentVersion(url){
  // Fetch the current version
  let { version: currentVersion } = await fetch(url, {
    headers: {
      Authorization: `Bearer ANONYMOUS`
    }
  }).then(res => res.json());

  console.log({ currentVersion })

  exec(`echo "testing-backend-version=${currentVersion}" >> $GITHUB_OUTPUT`);
  process.exit(0);
}

/**
 * Compare the new version with the current version
 * @param newVersion the new version
 * @param url the url to fetch the current version (this should return a json with a 'version' key)
 */
async function compareVersions(newVersion, url){
  let _newVersion = formatVersion(newVersion);

  // Fetch the current version
  let { version: currentVersion } = await fetch(url.replace("test.", ""), {
    headers: {
      Authorization: `Bearer ANONYMOUS`
    }
  }).then(res => res.json());

  let _currentVersion = formatVersion(currentVersion);

  // Compare the versions
  if(_newVersion === _currentVersion){
    console.log(`✅ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(0);
  } else {
    console.log(`❌ New version ${newVersion}, current version ${currentVersion}`);
    process.exit(1);
  }
}

if(process.argv[2] === "get-current-version") {
  getCurrentVersion(process.argv[3])
} else if (process.argv[2] === "assert") {
  compareVersions(process.argv[3], process.argv[4])
}
