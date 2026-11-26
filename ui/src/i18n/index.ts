import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales, type SupportedLocale } from "./locales";

export const LOCALE_STORAGE_KEY = "paperclip.locale";
type SupportedLocaleName = Extract<SupportedLocale, string>;
const supportedLocaleNames = supportedLocales as SupportedLocaleName[];

function resolveLocale(value: string | null | undefined): SupportedLocaleName | undefined {
  if (!value) return undefined;
  const exact = supportedLocaleNames.find((locale) => locale.toLowerCase() === value.toLowerCase());
  if (exact) return exact;
  const language = value.split("-")[0]?.toLowerCase();
  return supportedLocaleNames.find((locale) => locale.toLowerCase().split("-")[0] === language);
}

function initialLocale(): SupportedLocaleName {
  if (typeof window !== "undefined") {
    const stored = resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    if (stored) return stored;
    const browser = resolveLocale(window.navigator.language);
    if (browser) return browser;
  }
  return DEFAULT_LOCALE;
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: initialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export function setLocale(locale: SupportedLocaleName): void {
  if (!supportedLocaleNames.includes(locale)) return;
  void i18n.changeLanguage(locale);
  if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n };
