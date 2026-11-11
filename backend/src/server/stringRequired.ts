/**
 * The purpose of this function is to define a string field that is required and allows an empty string (zero length string)
 * @param fieldName
 */
export function stringRequired(...fieldName: string[]) {
  return function () {
    // Determine the root object. When running during Query.findOneAndUpdate with runValidators: true,
    // `this` is the Query instance, whose update payload is accessible via getUpdate().
    // @ts-ignore
    let target = this;
    // @ts-ignore
    if (target && typeof target.getUpdate === "function") {
      // @ts-ignore
      const update = target.getUpdate();
      target = update?.$set || update || target;
    }

    // Check for flattened path first (e.g. "locale.name") which Mongoose may set in update objects
    const flatKey = fieldName.join(".");
    if (target && typeof target === "object" && flatKey in target) {
      return typeof target[flatKey] !== "string";
    }

    // the reduce value return the nth level of the object,
    // i.e. for stringRequired("a", "b", "c"), it will return target["a"]["b"]["c"]
    // @ts-ignore
    const value = fieldName.reduce((acc, cur) => {
      return acc != null ? acc[cur] : undefined;
    }, target);

    return typeof value !== "string";
  };
}
