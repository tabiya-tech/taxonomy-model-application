import React, { createContext, useContext, useState } from "react";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";

type LanguageContextValue = {
  /** The language the content is currently displayed in. */
  language: string;
  setLanguage: (shortCode: string) => void;
  /** The language the user chose (null if none), kept across models that don't have it. */
  preferredLanguage: string | null;
  setPreferredLanguage: (shortCode: string) => void;
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
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, preferredLanguage, setPreferredLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
