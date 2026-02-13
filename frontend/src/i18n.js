import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { app_title: "Operation: Code 1983" } },
  es: { translation: { app_title: "Operación: Código 1983" } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;