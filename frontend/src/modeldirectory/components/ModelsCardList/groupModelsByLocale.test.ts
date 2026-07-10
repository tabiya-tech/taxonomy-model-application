// mute the console
import "src/_test_utilities/consoleMock";

import { groupModelsByLocale } from "./groupModelsByLocale";
import { getOneDeterministicFakeModel, getMockUUID } from "src/modeldirectory/_test_utilities/mockModelData";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

function getLocale(seed: number): ModelInfoTypes.Locale {
  return {
    UUID: getMockUUID(5000 + seed),
    name: `Locale ${seed}`,
    shortCode: `L${seed}`,
  };
}

describe("groupModelsByLocale", () => {
  test("should return an empty array when there are no models", () => {
    // GIVEN no models
    // WHEN groupModelsByLocale is called
    const actual = groupModelsByLocale([]);

    // THEN expect an empty array
    expect(actual).toEqual([]);
  });

  test("should group the models by their locale UUID", () => {
    // GIVEN three models in two locales
    const givenLocaleA = getLocale(1);
    const givenLocaleB = getLocale(2);
    const givenModel1 = getOneDeterministicFakeModel(1, { locale: givenLocaleA });
    const givenModel2 = getOneDeterministicFakeModel(2, { locale: givenLocaleB });
    const givenModel3 = getOneDeterministicFakeModel(3, { locale: givenLocaleA });

    // WHEN groupModelsByLocale is called
    const actual = groupModelsByLocale([givenModel1, givenModel2, givenModel3]);

    // THEN expect two groups, one per locale, each with the models of that locale
    expect(actual).toHaveLength(2);
    const actualGroupA = actual.find((group) => group.locale.UUID === givenLocaleA.UUID);
    const actualGroupB = actual.find((group) => group.locale.UUID === givenLocaleB.UUID);
    expect(actualGroupA?.models).toHaveLength(2);
    expect(actualGroupA?.models).toContain(givenModel1);
    expect(actualGroupA?.models).toContain(givenModel3);
    expect(actualGroupB?.models).toEqual([givenModel2]);
  });

  test("should sort the models within a group by createdAt descending and pick the newest as the latest model", () => {
    // GIVEN three models of the same locale created on different days, passed out of order
    const givenLocale = getLocale(1);
    const givenOldest = getOneDeterministicFakeModel(1, {
      locale: givenLocale,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    });
    const givenNewest = getOneDeterministicFakeModel(2, {
      locale: givenLocale,
      createdAt: new Date("2023-03-01T00:00:00.000Z"),
    });
    const givenMiddle = getOneDeterministicFakeModel(3, {
      locale: givenLocale,
      createdAt: new Date("2023-02-01T00:00:00.000Z"),
    });

    // WHEN groupModelsByLocale is called
    const actual = groupModelsByLocale([givenOldest, givenNewest, givenMiddle]);

    // THEN expect one group with the models sorted newest first
    expect(actual).toHaveLength(1);
    expect(actual[0].models).toEqual([givenNewest, givenMiddle, givenOldest]);
    // AND the latest model to be the newest one
    expect(actual[0].latestModel).toBe(givenNewest);
  });

  test("should sort the groups by the createdAt of their latest model, descending", () => {
    // GIVEN two locales where locale B has the most recently created model
    const givenLocaleA = getLocale(1);
    const givenLocaleB = getLocale(2);
    const givenModelA = getOneDeterministicFakeModel(1, {
      locale: givenLocaleA,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
    });
    const givenModelB = getOneDeterministicFakeModel(2, {
      locale: givenLocaleB,
      createdAt: new Date("2023-02-01T00:00:00.000Z"),
    });

    // WHEN groupModelsByLocale is called
    const actual = groupModelsByLocale([givenModelA, givenModelB]);

    // THEN expect the group of locale B to come first
    expect(actual.map((group) => group.locale.UUID)).toEqual([givenLocaleB.UUID, givenLocaleA.UUID]);
  });

  test("should not mutate the given models array", () => {
    // GIVEN two models of the same locale
    const givenLocale = getLocale(1);
    const givenModels = [
      getOneDeterministicFakeModel(1, { locale: givenLocale, createdAt: new Date("2023-01-01T00:00:00.000Z") }),
      getOneDeterministicFakeModel(2, { locale: givenLocale, createdAt: new Date("2023-02-01T00:00:00.000Z") }),
    ];
    const givenModelsCopy = [...givenModels];

    // WHEN groupModelsByLocale is called
    groupModelsByLocale(givenModels);

    // THEN expect the original array to be unchanged
    expect(givenModels).toEqual(givenModelsCopy);
  });
});
