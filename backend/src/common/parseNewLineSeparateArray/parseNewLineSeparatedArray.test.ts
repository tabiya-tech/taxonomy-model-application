import { arrayFromString, stringFromArray, uniqueArrayFromString } from "./parseNewLineSeparatedArray";

describe("arrayFromString", () => {
  test("should return an array with values", () => {
    //GIVEN a string with values separated by \n
    const given = "one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten";

    //WHEN the string is parsed
    const result = arrayFromString(given);

    //THEN an array with the values is returned
    expect(result).toEqual(["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]);
  });
  test.each([[""], [null], [undefined]])("should return an empty array for '%s'", (given) => {
    const result = arrayFromString(given);
    expect(result).toEqual([]);
  });
});

describe("stringFromArray", () => {
  test("should return a string with values separated by \\n", () => {
    //GIVEN an array with values
    const given = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

    //WHEN the array is converted to a string
    const result = stringFromArray(given);

    //THEN a string with the values separated by \n is returned
    expect(result).toEqual("one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten");
  });
  test("should return an empty string", () => {
    //GIVEN an empty array
    const given: string[] = [];

    //WHEN the array is converted to a string
    const result = stringFromArray(given);

    //THEN an empty string is returned
    expect(result).toEqual("");
  });
});

describe("uniqueArrayFromString", () => {
  test("should return an array with unique values preserving the order of the first occurrence of each value", () => {
    //GIVEN a string with values separated by \n
    const given = "one\ntwo\nthree\nfour\nthree\none\none\nfive\none\ntwo\nthree";

    //WHEN the string is parsed
    const result = uniqueArrayFromString(given);

    //THEN an array with the unique values is returned in the order of the first occurrence of each value
    expect(result).toEqual({ uniqueArray: ["one", "two", "three", "four", "five"], duplicateCount: 6 });
  });
  test.each([[""], [null], [undefined]])("should return an empty array for '%s'", (given) => {
    //GIVEN an empty string or null or undefined
    const result = uniqueArrayFromString(given);

    //WHEN the string is parsed
    expect(result).toEqual({ uniqueArray: [], duplicateCount: 0 });
  });
});
