async function loadVersion() {
    try {
      // Make API calls concurrently
      const [feResponse, beResponse] = await Promise.all([
        fetch('version.json').then(response => response.json()),
        fetch('https://j17b26oc5i.execute-api.eu-central-1.amazonaws.com/dev/version').then(response => response.json())
      ]);
  
      // Render frontend info
      const feData = {
        date: feResponse.date,
        branch: feResponse.branch,
        buildNumber: feResponse.buildNumber,
        sha: feResponse.sha
      };
      renderInfo(feData, 'fe-info');
  
      // Render backend info
      const beData = {
        date: beResponse.date,
        branch: beResponse.branch,
        buildNumber: beResponse.buildNumber,
        sha: beResponse.sha
      };
      renderInfo(beData, 'be-info');
    } catch (error) {
      console.error(error);
    }
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
  