import React, { createContext, useContext, useState } from "react";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";

type LanguageContextValue = {
  language: string;
  setLanguage: (shortCode: string) => void;
};

export const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

type LanguageProviderProps = {
  children: React.ReactNode;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
