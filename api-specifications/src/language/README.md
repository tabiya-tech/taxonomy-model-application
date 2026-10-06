# Language registry

The single source of truth for the languages the platform knows about.

```typescript
import LanguageAPISpecs from "api-specifications/language";

LanguageAPISpecs.Constants.Languages; // the registry, a frozen readonly array
LanguageAPISpecs.Constants.FALLBACK_LANGUAGE; // "en", an entry of the registry
LanguageAPISpecs.Helpers.getLanguageByShortCode("fr");
LanguageAPISpecs.Types.LanguageShortCode; // "en" | "fr"
LanguageAPISpecs.Types.ITranslatedString; // { en: "Cook", fr: "Cuisinier" }
LanguageAPISpecs.Schemas.getTranslatedString({ description: "The preferred label", maxLength: 256 });
```

## Translated values

A value that is translated in several languages is a `Record<dbKeyName, string>`, and a list of them, e.g. the
altLabels, is a `Record<dbKeyName, string>[]`. `Schemas.getTranslatedString()` and `Schemas.getTranslatedStringArray()`
build the JSON Schema of such a value out of the registry: one property per registered `dbKeyName`, no other key
allowed, and the length limit of the field enforced for every language on its own.

The primitives live here, next to the registry, because a translated value is keyed by a **language**. It is not keyed
by a locale, and the two must not be conflated, see below.

## The contract

```typescript
interface ILanguageConfig {
  name: string; // "French"
  shortCode: string; // "fr"   what the client sends in Accept-Language
  dbKeyName: string; // "fr"   the key inside the translated sub-document
  csvSuffix: string; // "FR"   the CSV column suffix
}
```

## Why the registry is bundled and not served

A locale is data. A model author picks one from a list and the list can grow without any code change, which is why
`locales.json` is served from the locales bucket.

A language is not data. Adding one means a new `dbKeyName` that the Mongoose schemas validate against, a new
`csvSuffix` that the import and export column builders emit, and per language embedding configuration. The code has to
ship anyway. Bundling the registry gives compile time safety, keeps the backend and the frontend on exactly the same
list, and removes a network call from the request path of every language resolution. Both subprojects already consume
`api-specifications` through `yarn link`, so there is nothing to wire up.

**The consequence to accept:** adding a language is a code change and a release of `api-specifications`, followed by a
rebuild of the backend and the frontend. It cannot be done by editing a file in an S3 bucket.

`locales.json` keeps serving country and market locales. Those stay a separate concern from translation languages, and
this module does not touch `locales/` or `iac/locales/`.

## Checklist for adding a language

1. Add the entry to the registry in [`constants.ts`](./constants.ts). Follow the existing entries: declare it as its own
   frozen `const` and add that const to `Languages`, so that a consumer can hold a reference to it.
   - `shortCode`, `dbKeyName` and `csvSuffix` must each be unique across the whole registry. A test asserts this by
     reading the registry, so a duplicate fails the build rather than slipping through.
   - Every field must be a non empty string within the max lengths in `constants.ts`. A test validates every entry of
     the registry against the JSON Schema.
2. Run `yarn test` in `api-specifications/`. The per language snapshots in `__snapshots__/constants.test.ts.snap` and
   the module snapshot in `__snapshots__/index.test.ts.snap` will fail. Review the diff, then update them with
   `yarn test -u`. Do not update them blind, the diff is the review of the new entry.
3. Run `yarn lint`, `yarn format:check` and `yarn compile` in `api-specifications/`. **The compile step is required**,
   the package is consumed from `dist/` through `yarn link`, so nothing downstream sees the new language until it is
   recompiled.
4. Release `api-specifications`.
5. Backend: the new `dbKeyName` widens `LanguageShortCode` and the translated sub-document keys. Check the Mongoose
   schemas that validate against the registry, and the import and export column builders that emit `csvSuffix`
   columns. Rebuild.
6. Embeddings: there is no per language embedding configuration to add, but there is a check to make.
   - Every embedding service of [`embeddings/constants.ts`](../embeddings/constants.ts) embeds every language a model
     has. Confirm that its `modelName` supports the new language. If it does not, the language needs a new embedding
     service entry, which is a change of its own.
   - The embedding process pushes one task per entity per language of the model's `availableLanguages`, and the vector
     search indexes already filter on `language`, so neither needs a change.
7. Data: no script adds a language to the data of an existing model. A model gets the language by being imported with
   it:
   - export the model, or start from the source CSV files,
   - add the language to the `LANGUAGES` column of `model_info.csv`, and a `_<csvSuffix>` column to every translatable
     field, see [Languages](../../../backend/Import_Export_CSV_format.md#languages) in the CSV format documentation,
   - import the files as a new model, with the language selected in the import dialog,
   - trigger an embedding process for the new model, `POST /models/{modelId}/embedding-processes`, so that it is
     embedded in every language it has.
8. Frontend: the new language becomes selectable in the import dialog, `ModelLanguagesSelectField` renders the registry
   as `name (shortCode)`. No frontend copy names a language by hand, the only language specific copy is derived from
   `FALLBACK_LANGUAGE.name`, so there is no copy to translate. Review the snapshots that render the list of languages,
   and add the language to the table of [Languages](../../../backend/Import_Export_CSV_format.md#languages) in the CSV
   format documentation. Rebuild.
9. Run `./run-before-merge.sh` from the repository root.

## Shape validation versus registry membership

`LanguageAPISpecs.Schemas.Payload` validates the _shape_ of an `ILanguageConfig`, the same way the locale spec does. It
does not check that the language is in the registry, so a well formed payload for an unknown language passes it.

Use `LanguageAPISpecs.Helpers.isSupportedLanguage(shortCode)` for membership. It is a type guard, so it narrows a
`string` to `LanguageAPISpecs.Types.LanguageShortCode`. Where the code has a literal, the union type already makes an
unsupported language a compile error and no runtime check is needed.

## Lookups are exact

`getLanguageByShortCode` and `getLanguageByCsvSuffix` match exactly and are case sensitive. A caller that holds a value
coming from the outside world, an `Accept-Language` header or a CSV column name, normalizes it before looking it up.
