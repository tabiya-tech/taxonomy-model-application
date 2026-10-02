// mute the console output
import "src/_test_utilities/consoleMock";

import { act, renderHook } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageProvider";
import { DEFAULT_LANGUAGE } from "./languages.service";

describe("LanguageProvider", () => {
  test("should default to DEFAULT_LANGUAGE when nothing has been selected yet", () => {
    // GIVEN a consumer wrapped in the LanguageProvider
    // WHEN the current language is read
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });

    // THEN expect it to be the default language
    expect(result.current.language).toEqual(DEFAULT_LANGUAGE);
  });

  test("should update the language seen by consumers when setLanguage is called", () => {
    // GIVEN a consumer wrapped in the LanguageProvider
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    // AND a language to switch to
    const givenLanguage = "fr";

    // WHEN setLanguage is called with it
    act(() => {
      result.current.setLanguage(givenLanguage);
    });

    // THEN expect the consumer to see the new language
    expect(result.current.language).toEqual(givenLanguage);
  });

  test("should return the default context value when used outside a LanguageProvider", () => {
    // GIVEN a consumer that is not wrapped in the LanguageProvider
    // WHEN the current language is read
    const { result } = renderHook(() => useLanguage());

    // THEN expect it to be the default language
    expect(result.current.language).toEqual(DEFAULT_LANGUAGE);
  });
});
