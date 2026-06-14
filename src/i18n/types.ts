export type Language = 'en' | 'uk';

export const LANGUAGES: Language[] = ['en', 'uk'];

/** Flat dotted-key dictionary. Values may contain {param} placeholders. */
export type Dictionary = Record<string, string>;

export interface TranslateParams {
  [key: string]: string | number;
}
