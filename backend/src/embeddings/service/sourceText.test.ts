// silence chatty console
import "_test_utilities/consoleMock";

import { computeSourceHash, getSourceText, IEmbeddableEntity } from "./sourceText";
import { EmbeddableField } from "./types";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("Test getSourceText", () => {
  const givenEntity: IEmbeddableEntity = {
    id: getMockStringId(1),
    modelId: getMockStringId(2),
    preferredLabel: "some preferred label",
    altLabels: ["first alt label", "second alt label"],
    description: "some description",
    scopeNote: "some scope note",
  };

  test.each([
    [EmbeddableField.preferredLabel, "some preferred label"],
    [EmbeddableField.description, "some description"],
    [EmbeddableField.scopeNote, "some scope note"],
    [EmbeddableField.altLabels, "first alt label\nsecond alt label"],
  ])("should return the source text of the '%s' field", (givenField, expectedSourceText) => {
    // GIVEN an entity with all the embeddable fields
    // WHEN building the source text of the given field
    const actualSourceText = getSourceText(givenEntity, givenField);

    // THEN expect the expected source text to be returned
    expect(actualSourceText).toEqual(expectedSourceText);
  });

  test("should return an empty string for a field the entity does not have", () => {
    // GIVEN an entity without a scope note (e.g. an occupation group)
    const givenEntityWithoutScopeNote: IEmbeddableEntity = { ...givenEntity, scopeNote: undefined };

    // WHEN building the source text of the scopeNote field
    const actualSourceText = getSourceText(givenEntityWithoutScopeNote, EmbeddableField.scopeNote);

    // THEN expect an empty string to be returned
    expect(actualSourceText).toEqual("");
  });
});

describe("Test computeSourceHash", () => {
  test("should return the md5 hash of the source text in the md5:<hash> format", () => {
    // GIVEN a source text with a known md5 hash
    const givenSourceText = "hello world";

    // WHEN computing the hash of the source text
    const actualSourceHash = computeSourceHash(givenSourceText);

    // THEN expect the hash to be in the md5:<hash> format with the known md5 of the text
    expect(actualSourceHash).toEqual("md5:5eb63bbbe01eeed093cb22bb8f5acdc3");
  });

  test("should return the same hash for the same source text and a different hash for a different one", () => {
    // GIVEN two different source texts
    const givenSourceText = "some source text";
    const givenOtherSourceText = "some other source text";

    // WHEN computing the hashes of the source texts
    const actualSourceHash = computeSourceHash(givenSourceText);
    const actualSameSourceHash = computeSourceHash(givenSourceText);
    const actualOtherSourceHash = computeSourceHash(givenOtherSourceText);

    // THEN expect the same text to produce the same hash
    expect(actualSourceHash).toEqual(actualSameSourceHash);
    // AND expect a different text to produce a different hash
    expect(actualSourceHash).not.toEqual(actualOtherSourceHash);
  });
});
