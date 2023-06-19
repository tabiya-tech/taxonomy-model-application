export function getStdHeadersValidator(modelid: string,  expectedHeaders: string []): (actualHeaders: string[]) => Promise<boolean> {
  return async (actualHeaders: string[]) => {
    let valid = true;
    for (const element of expectedHeaders) {
      if (!actualHeaders.includes(element)) {
        valid = false;
        console.warn(`When importing data for model ${modelid}, expected to include header ${element}`);
      }
    }
    return valid;
  };
}