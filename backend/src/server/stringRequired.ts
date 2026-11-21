/**
 * The purpose of this function is to define a string field that is required and allows an empty string (zero length string)
 * @param fieldName
 */
export function stringRequired(...fieldName: string[]) {
  return function (this: unknown): boolean {
    const context = this as {
      get?: (path: string) => unknown;
      getUpdate?: () => unknown;
    } | null;

    if (context != null && typeof context.getUpdate === "function" && typeof context.get === "function") {
      const path = fieldName.join(".");
      let value = context.get(path);

      if (value === undefined && fieldName.length > 1) {
        value = context.get(fieldName[0]);
        for (const segment of fieldName.slice(1)) {
          if (value === null || typeof value !== "object") {
            value = undefined;
            break;
          }
          value = (value as Record<string, unknown>)[segment];
        }
      }

      return typeof value !== "string";
    }

    const value = fieldName.reduce((acc: unknown, cur) => {
      if (acc === null || (typeof acc !== "object" && typeof acc !== "function")) return undefined;
      return (acc as Record<string, unknown>)[cur];
    }, this);

    return typeof value !== "string";
  };
}
