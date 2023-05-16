import {WHITESPACE} from "./specialCharacters";
import {IModelInfoResponse} from "../modelInfo";

function testDateTime(propertyName: string ,properrtypart) {

}
describe("Fail validation '/createdAt'", () => {
  test.each([
    ["undefined", undefined, {
      instancePath: "",
      keyword: "required",
      message: "must have required property 'createdAt'"
    }],
    ["null", null, {instancePath: "/createdAt", keyword: "type", message: "must be string"}],
    ["empty", "", {
      instancePath: "/createdAt",
      keyword: "format",
      message: 'must match format "date-time"'
    }],
    ["only whitespace characters", WHITESPACE, {
      instancePath: "/createdAt",
      keyword: "format",
      message: 'must match format "date-time"'
    }],
    ["not ISO date", "13-11-2018T20:20:39+00:00", {
      instancePath: "/createdAt",
      keyword: "format",
      message: 'must match format "date-time"'
    }],
  ])
  ("Fail validation '/createdAt' because it is %s", (caseDescription, value, failure) => {
    const spec: Partial<IModelInfoResponse> = {
      //@ts-ignore
      createdAt: value
    };
    assertValidationErrors(ajv, spec, failure); // TODO
  });
});