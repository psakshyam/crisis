import { en } from "./locales/en.js";

const activeLocale = en;

function getPathValue(root, path) {
  return path.split(".").reduce((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    return acc[key];
  }, root);
}

export function t(path, fallback = "") {
  const value = getPathValue(activeLocale, path);
  if (typeof value === "string") {
    return value;
  }
  return fallback;
}

export function resolveI18nString(value) {
  if (typeof value !== "string") {
    return value;
  }

  if (!value.startsWith("i18n:")) {
    return value;
  }

  const key = value.slice(5);
  return t(key, value);
}

export function localizeScenarioData(data) {
  if (Array.isArray(data)) {
    return data.map((item) => localizeScenarioData(item));
  }

  if (data && typeof data === "object") {
    const output = {};
    Object.entries(data).forEach(([key, value]) => {
      output[key] = localizeScenarioData(value);
    });
    return output;
  }

  return resolveI18nString(data);
}

export const uiText = activeLocale.ui;
