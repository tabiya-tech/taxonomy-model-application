async function loadInfo() {
  // Make API calls concurrently
  const data = await Promise.all([
    loadInfoFromUrl('version.json'),
    loadInfoFromUrl('https://j17b26oc5i.execute-api.eu-central-1.amazonaws.com/dev/info')
  ]);
  renderInfo(data[0], 'fe-info');
  renderInfo(data[1], 'be-info');
}

function renderInfo(data, elementId) {
  // Get the HTML element where you want to display the data
  const element = document.getElementById(elementId);
  // Create a new HTML element to display the data

  const html = `
      <ul>
        <li>Date: ${data.date}</li>
        <li>Branch: ${data.branch}</li>
        <li>Build Number: ${data.buildNumber}</li>
        <li>GIT SHA: ${data.sha}</li>
      </ul>
    `;

  // Add the HTML element to the DOM
  element.innerHTML = html;
}

// service

async function loadInfoFromUrl(url) {
  try {
    return await fetch(url).then(async response => {
      const data = await response.json();
      if (data === null) {
        throw new Error('No data');
      }
      //jsonschema verify
      return {date: data.date, branch: data.branch, buildNumber: data.buildNumber, sha: data.sha};
    });
  } catch (error) {
    console.error(error);
    return {date: "", branch: "", buildNumber: "", sha: ""};
  }
}