export function getStdHeadersValidator(modelid: string,  expectedHeaders: string []): (actualHeaders: string[]) => Promise<boolean> {
  return async (actualHeaders: string[]) => {
    let valid = true;
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (!actualHeaders.includes(expectedHeaders[i])) {
        valid = false;
        console.warn(`When importing data for model ${modelid}, expected to include header ${expectedHeaders[i]}`);
      }
    }
    return valid;
  };
}