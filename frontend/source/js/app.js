async function loadInfo() {
    try {
      // Make API calls concurrently
      let feResponse=await fetch('version.json').then(response => response.json())
      let beResponse =JSON.parse(await fetch('https://j17b26oc5i.execute-api.eu-central-1.amazonaws.com/dev/info').then(response => response.json()))
      renderInfo(feResponse, 'fe-info');
      renderInfo(beResponse, 'be-info');
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
  