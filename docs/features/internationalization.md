# Languages (Internationalization)

The whole interface speaks two languages: **English** and **Ukrainian**. Ukraine is the
primary audience, so the Ukrainian copy is written to read naturally — jokes and all —
not machine-translated.

## Switching

A switcher in the header (`LanguageSwitcher`) toggles **EN / UA**. The choice is saved to
`localStorage` and restored on the next visit. On a first visit with nothing saved, the
app follows the browser's language (Ukrainian if the browser is set to Ukrainian,
otherwise English).

## How it works

- Every visible string — headings, buttons, hints, taunts, `aria` labels, cuisine labels —
  comes from a translation key rather than being written inline.
- Each language is a flat dictionary (`src/i18n/en.ts`, `src/i18n/uk.ts`) that mirror each
  other key-for-key.
- Lookups go through a small `t('some.key')` helper. It supports value interpolation
  (e.g. "{city}", "{count}") and, for Ukrainian, correct **plural** forms (1 / 2–4 / 5+).
- If a key is ever missing, the key name itself is shown — a loud, obvious placeholder
  rather than a blank.

## Not translated (on purpose)

Brand names (Glovo, Bolt Food, OpenStreetMap), raw map cuisine tags, numbers, and emoji
are left as-is in both languages.

## Related

- [Cuisine families](cuisine-families.md) — labels that follow the language.
- [Persistence & offline](persistence.md) — where the language choice is stored.
