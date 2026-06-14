import type { Dictionary, TranslateParams } from './types';

/** Look up a key, interpolate {params}; fall back to the key so gaps are visible. */
export const translate = (
  dictionary: Dictionary,
  key: string,
  params?: TranslateParams,
): string => {
  const template = dictionary[key];
  if (!template) {
    return key;
  }
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
};

/** Ukrainian plural: one (1,21,31…), few (2–4,22–24…), many (0,5–20,11–14…). */
export const pluralUk = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
};
