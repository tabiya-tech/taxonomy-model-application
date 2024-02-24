import { arrayFromString, stringFromArray } from "./parseNewLineSeparatedArray";

describe("arrayFromString", () => {
  test("should return an array with values", () => {
    const given = "one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten";
    const result = arrayFromString(given);
    expect(result).toEqual(["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]);
  });
  test.each([[""], [null], [undefined]])("should return an empty array for '%s'", (given) => {
    const result = arrayFromString(given);
    expect(result).toEqual([]);
  });
});

describe("stringFromArray", () => {
  test("should return a string with values separated by \\n", () => {
    const given = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const result = stringFromArray(given);
    expect(result).toEqual("one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten");
  });
  test("should return an empty string", () => {
    const given: string[] = [];
    const result = stringFromArray(given);
    expect(result).toEqual("");
  });
});
