// src/components/public/LanguageProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Language, t as translate } from "@/lib/i18n";

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}>({
  lang: "am",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("am");

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Language) || "am";
    setLangState(saved);
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  function t(key: string) {
    return translate(key, lang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
