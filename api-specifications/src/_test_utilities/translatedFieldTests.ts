import { SchemaObject } from "ajv";
import { assertCaseForProperty, CaseType, constructSchemaError, SchemaError } from "./assertCaseForProperty";
import { getTestString } from "./specialCharacters";
import LanguageConstants from "../language/constants";

type TestCase = [CaseType, string, unknown, SchemaError | undefined];

const fallback = LanguageConstants.FALLBACK_LANGUAGE.dbKeyName;

function runCases(fieldName: string, givenSchema: SchemaObject, cases: TestCase[]) {
  test.each(cases)(`(%s) Validate '${fieldName}' when it is %s`, (caseType, _description, givenValue, failure) => {
    // GIVEN an object with the given value
    const givenObject = { [fieldName]: givenValue };
    // THEN expect the object to validate accordingly
    assertCaseForProperty(fieldName, givenObject, givenSchema, caseType, failure);
  });
}

/**
 * Tests a translatable field of a request schema.
 * "full" (POST/PUT): the field is required and must carry the fallback language.
 * "patch" (PATCH): the field is optional, the fallback may be omitted, and a non-fallback language may be null.
 */
export function testTranslatedStringField(
  fieldName: string,
  maxLength: number,
  givenSchema: SchemaObject,
  mode: "full" | "patch"
) {
  const commonCases: TestCase[] = [
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be object")],
    [CaseType.Success, "a single language value", { [fallback]: getTestString(maxLength) }, undefined],
    [
      CaseType.Success,
      "a multi language value",
      { [fallback]: getTestString(maxLength), fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Failure,
      "a value in a language that is not in the registry",
      { [fallback]: getTestString(maxLength), tlh: "nuqneH" },
      constructSchemaError(`/${fieldName}`, "additionalProperties", "must NOT have additional properties"),
    ],
    [
      CaseType.Failure,
      "a value longer than the maximum length in one language only",
      { [fallback]: getTestString(maxLength), fr: getTestString(maxLength + 1) },
      constructSchemaError(`/${fieldName}/fr`, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
  ];
  const modeCases: TestCase[] =
    mode === "full"
      ? [
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", `must have required property '${fieldName}'`),
          ],
          [
            CaseType.Failure,
            "a value missing the fallback language",
            { fr: getTestString(maxLength) },
            constructSchemaError(`/${fieldName}`, "required", `must have required property '${fallback}'`),
          ],
          [
            CaseType.Failure,
            "a value with a non fallback language set to null",
            { [fallback]: getTestString(maxLength), fr: null },
            constructSchemaError(`/${fieldName}/fr`, "type", "must be string"),
          ],
        ]
      : [
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Success, "a value missing the fallback language", { fr: getTestString(maxLength) }, undefined],
          [CaseType.Success, "a value with a non fallback language set to null", { fr: null }, undefined],
          [
            CaseType.Failure,
            "a value with the fallback language set to null",
            { [fallback]: null },
            constructSchemaError(`/${fieldName}/${fallback}`, "type", "must be string"),
          ],
        ];
  runCases(fieldName, givenSchema, [...modeCases, ...commonCases]);
}

/**
 * Tests a list of translatable values (e.g. altLabels) of a request schema. Every item must carry the fallback
 * language, as the list is always replaced as a whole.
 */
export function testTranslatedStringArrayField(
  fieldName: string,
  maxLength: number,
  givenSchema: SchemaObject,
  mode: "full" | "patch"
) {
  runCases(fieldName, givenSchema, [
    mode === "full"
      ? [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", `must have required property '${fieldName}'`),
        ]
      : [CaseType.Success, "undefined", undefined, undefined],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be array")],
    [
      CaseType.Success,
      "an array of single language values",
      [{ [fallback]: getTestString(maxLength) }, { [fallback]: getTestString(maxLength - 1) }],
      undefined,
    ],
    [
      CaseType.Success,
      "an array of multi language values",
      [{ [fallback]: getTestString(maxLength), fr: getTestString(maxLength) }],
      undefined,
    ],
    [
      CaseType.Failure,
      "an array with an item missing the fallback language",
      [{ fr: getTestString(maxLength) }],
      constructSchemaError(`/${fieldName}/0`, "required", `must have required property '${fallback}'`),
    ],
    [
      CaseType.Failure,
      "an array of the same translated value",
      [{ [fallback]: "foo" }, { [fallback]: "foo" }],
      constructSchemaError(
        `/${fieldName}`,
        "uniqueItems",
        "must NOT have duplicate items (items ## 0 and 1 are identical)"
      ),
    ],
    [
      CaseType.Failure,
      "an array with an item in a language that is not in the registry",
      [{ [fallback]: getTestString(maxLength), tlh: "nuqneH" }],
      constructSchemaError(`/${fieldName}/0`, "additionalProperties", "must NOT have additional properties"),
    ],
    [
      CaseType.Failure,
      "an array with an item longer than the maximum length in one language only",
      [{ [fallback]: getTestString(maxLength), fr: getTestString(maxLength + 1) }],
      constructSchemaError(`/${fieldName}/0/fr`, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
  ]);
}
