import React, { createContext, useContext, useState } from "react";
import LanguageAPISpecs from "api-specifications/language";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";

type LanguageContextValue = {
  /** The language the content is currently displayed in. */
  language: LanguageAPISpecs.Types.LanguageShortCode;
  setLanguage: (shortCode: LanguageAPISpecs.Types.LanguageShortCode) => void;
  /** The language the user chose (null if none), kept across models that don't have it. */
  preferredLanguage: LanguageAPISpecs.Types.LanguageShortCode | null;
  setPreferredLanguage: (shortCode: LanguageAPISpecs.Types.LanguageShortCode) => void;
};

export const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  preferredLanguage: null,
  setPreferredLanguage: () => {},
});

type LanguageProviderProps = {
  children: React.ReactNode;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageAPISpecs.Types.LanguageShortCode>(DEFAULT_LANGUAGE);
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageAPISpecs.Types.LanguageShortCode | null>(null);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, preferredLanguage, setPreferredLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
