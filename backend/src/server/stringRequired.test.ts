import { stringRequired } from "./stringRequired";

/**
 * `stringRequired` returns the predicate Mongoose uses as the `required` option of a path.
 *
 * It is called with `this` bound to the document on `save()`/`validate()`, but with `this`
 * bound to the Query on update validators (`findOneAndUpdate(..., { runValidators: true })`).
 * In the Query case a nested parent such as `locale` is not reachable from `this`, so reading
 * `this.locale.name` used to throw a TypeError that Mongoose reported as a validation failure
 * (HTTP 500 on PUT /models/{id}). This suite pins both contexts.
 */
type RequiredValidator = (this: unknown) => boolean;

function callValidator(validator: () => boolean, context: unknown): boolean {
  return (validator as unknown as RequiredValidator).call(context);
}

function getQueryContext(values: Record<string, unknown>) {
  return {
    getUpdate: () => ({ $set: values }),
    get(path: string) {
      return Object.prototype.hasOwnProperty.call(values, path) ? values[path] : undefined;
    },
  };
}

describe("Test the stringRequired function", () => {
  describe("When called with a document as `this` (save / validate)", () => {
    test.each([
      { description: "a non empty string", value: "John", expected: false },
      { description: "an empty string", value: "", expected: false },
      { description: "a whitespace string", value: "   ", expected: false },
      { description: "a number", value: 123, expected: true },
      { description: "null", value: null, expected: true },
      { description: "undefined", value: undefined, expected: true },
      { description: "an object", value: {}, expected: true },
      { description: "an array", value: [], expected: true },
    ])("Should return $expected for a top level field holding $description", ({ value, expected }) => {
      // GIVEN a validator for a top level field
      const givenValidator = stringRequired("name");
      // WHEN it is called with the document as `this`
      const actual = callValidator(givenValidator, { name: value });
      // THEN expect the required predicate to follow the documented contract
      // (a string, including the empty string, is allowed; anything else is treated as missing)
      expect(actual).toEqual(expected);
    });

    test.each([
      { description: "a non empty string", value: "English", expected: false },
      { description: "an empty string", value: "", expected: false },
      { description: "a number", value: 1, expected: true },
      { description: "undefined", value: undefined, expected: true },
    ])("Should return $expected for a nested field holding $description", ({ value, expected }) => {
      // GIVEN a validator for a nested field
      const givenValidator = stringRequired("locale", "name");
      // WHEN it is called with the document as `this`
      const actual = callValidator(givenValidator, { locale: { name: value } });
      // THEN expect the required predicate to follow the documented contract
      expect(actual).toEqual(expected);
    });
  });

  describe("When called with a Query as `this` (update validators)", () => {
    test.each([
      { description: "an empty string", value: "", expected: false },
      { description: "a non-empty string", value: "text", expected: false },
      { description: "a non-string value", value: undefined, expected: true },
    ])("Should return $expected for a top-level update value that is $description", ({ value, expected }) => {
      const givenValidator = stringRequired("description");
      const context = getQueryContext({ description: value });

      expect(callValidator(givenValidator, context)).toEqual(expected);
    });

    test.each([
      { description: "an empty string", value: "", expected: false },
      { description: "a non-empty string", value: "English", expected: false },
      { description: "a non-string value", value: undefined, expected: true },
    ])("Should return $expected for a nested update value that is $description", ({ value, expected }) => {
      const givenValidator = stringRequired("locale", "name");
      const context = getQueryContext({ locale: { name: value } });

      expect(callValidator(givenValidator, context)).toEqual(expected);
    });

    test("Should read a nested value set using a dotted update path", () => {
      const givenValidator = stringRequired("locale", "name");
      const context = getQueryContext({ "locale.name": "" });

      expect(callValidator(givenValidator, context)).toEqual(false);
    });

    // If a path is absent from an update, Mongoose only validates the paths being updated.
    test.each([
      { description: "an object that lacks the parent path", context: {} },
      { description: "a null parent path", context: { locale: null } },
      { description: "an undefined parent path", context: { locale: undefined } },
      { description: "a null `this`", context: null },
      { description: "an undefined `this`", context: undefined },
    ])("Should not throw and should report the nested field as required for $description", ({ context }) => {
      // GIVEN a validator for a nested field
      const givenValidator = stringRequired("locale", "name");
      // WHEN it is called with a `this` that cannot resolve the path
      const run = () => callValidator(givenValidator, context);
      // THEN expect it not to throw
      expect(run).not.toThrow();
      // AND expect it to report the field as required
      expect(run()).toEqual(true);
    });

    test("Should not throw and should report a deeply nested field as required when an intermediate level is missing", () => {
      // GIVEN a validator for a deeply nested field
      const givenValidator = stringRequired("a", "b", "c");
      // WHEN it is called with a `this` where `a` exists but `a.b` does not
      const run = () => callValidator(givenValidator, { a: {} });
      // THEN expect it not to throw
      expect(run).not.toThrow();
      // AND expect it to report the field as required
      expect(run()).toEqual(true);
    });

    test("Should report a top level field as required when the update omits it", () => {
      // GIVEN a validator for a top level field
      const givenValidator = stringRequired("description");
      // WHEN it is called with a Query whose update does not include that field
      const actual = callValidator(givenValidator, getQueryContext({}));
      // THEN expect it to report the field as required
      expect(actual).toEqual(true);
    });
  });
});
