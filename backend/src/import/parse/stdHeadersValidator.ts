import errorLogger from "common/errorLogger/errorLogger";

export function getStdHeadersValidator(
  validatorName: string,
  expectedHeaders: string[]
): (actualHeaders: string[]) => Promise<boolean> {
  return async (actualHeaders: string[]) => {
    let valid = true;
    for (const element of expectedHeaders) {
      if (!actualHeaders.includes(element)) {
        valid = false;
        errorLogger.logError(`Failed to validate header for ${validatorName}, expected to include header ${element}`);
      }
    }
    return valid;
  };
}
