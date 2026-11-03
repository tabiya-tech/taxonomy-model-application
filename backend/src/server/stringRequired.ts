/**
 * The purpose of this function is to define a string field that is required and allows an empty string (zero length string)
 * @param fieldName
 */
export function stringRequired(...fieldName: string[]) {
  return function () {
    // the reduce value  return the nth level of the object,
    // i.e. for stringRequired("a", "b", "c"), it will return this["a"]["b"]["c"]
    // Walk the path from `this`, tolerating a missing parent.
    // Under update validators (findOneAndUpdate + runValidators) `this` is the Query,
    // so an intermediate segment like `locale` can be undefined; `locale.name` would throw.

    // @ts-ignore
    const value = fieldName.reduce((acc, cur) => {
      return acc == null ? undefined : acc[cur];
      // @ts-ignore
    }, this);

    return typeof value !== "string";
  };
}
