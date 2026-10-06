# Add Language To Model

A CLI tool to add a new language to a model that has already been imported, by matching a CSV of translations
against the model's existing entities and merging the new language into their localized fields.

## Overview

This tool never re-imports a taxonomy and never creates an entity. It matches each CSV row to an existing entity
by the CSV's `ID` column (the entity's stored `importId`), never by label, and merges the new language's values
into that entity's translatable fields, leaving every other language and every other field untouched. A row that
matches no entity is reported and skipped. The model's `availableLanguages` is extended with the new language.
Hierarchies and relations are never read or written, and embeddings for the new language are not generated
automatically — the tool prints the follow-up command for that.

## Prerequisites

Refer to the [backend's README](/backend/README.md#prerequisites) for system requirements and installation
instructions.

`MONGODB_URI` must be set, in the same terminal, to the connection string of the database that holds the model:

```bash
export MONGODB_URI="mongodb://localhost:27017/"
```

For an Atlas cluster, copy the connection string from Atlas's "Connect your application" dialog, then add the
database name into the path, before the `?` — the string Atlas gives you doesn't include one, and without it
you'll connect successfully but land in the wrong database:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<database name>?retryWrites=true&w=majority
```

The model's id is not shown anywhere in the model's properties panel (that panel shows a separate `UUID` field).
Find it in the browser's address bar after opening the model in the app's Explorer: `/explorer/<modelId>/...`.

## Usage

### CLI Interface

```bash
cd backend/src/scripts/addLanguageToModel  # from the repository root

npx ts-node cli.ts \
  -m <modelId> \
  -l fr \
  --occupation-groups-csv /path/to/occupation_groups.csv \
  --occupations-csv /path/to/occupations.csv \
  --skills-csv /path/to/skills.csv \
  --skill-groups-csv /path/to/skill_groups.csv \
  -o /path/to/output/folder
```

At least one of the four `--*-csv` options is required; leave out whichever entity types you have no
translations for yet — a run doesn't have to cover all four at once, and you can run it again later with more
`--*-csv` options to cover the rest. For all available options and detailed descriptions, run:

```bash
npx ts-node cli.ts --help
```

`npx ts-node` runs the project's local copy of `ts-node` without needing it installed globally. If you do have
`ts-node` on your `PATH`, the script is also directly executable: `./cli.ts ...` (see
[Troubleshooting](#troubleshooting)).

Add `--dry-run` to compute matched/unmatched/would-change counts and write the same report, without writing any
change to the database.

### Programmatic Usage

```typescript
import { addLanguageToModel } from "./main";

const result = await addLanguageToModel({
  modelId: "...",
  languageShortCode: "fr",
  occupationsCsvPath: "/path/to/occupations.csv",
  skillsCsvPath: "/path/to/skills.csv",
  outputFolderPath: "/path/to/output/folder",
  dryRun: false, // optional
  verbose: true, // optional
});
```

This assumes the repository registry is already initialized against a connection, as the CLI does via
`getRepositoryRegistry().initialize(connection)`.

## CSV Format

Each CSV needs the `ID` column (the id used at import time) plus one `FIELD_LANGUAGECODE` column per translatable
field, e.g. `PREFERREDLABEL_FR`. Language codes match import/export: `EN`, `FR`, `ES`, `PT`, `AM`. A field with no
translation yet can be left out entirely; a blank cell is skipped rather than written as empty.

| Option                    | Translatable fields                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `--occupation-groups-csv` | `PREFERREDLABEL`, `DESCRIPTION`, `ALTLABELS`                                                       |
| `--occupations-csv`       | `PREFERREDLABEL`, `DESCRIPTION`, `DEFINITION`, `SCOPENOTE`, `REGULATEDPROFESSIONNOTE`, `ALTLABELS` |
| `--skills-csv`            | `PREFERREDLABEL`, `DESCRIPTION`, `DEFINITION`, `SCOPENOTE`, `ALTLABELS`                            |
| `--skill-groups-csv`      | `PREFERREDLABEL`, `DESCRIPTION`, `SCOPENOTE`, `ALTLABELS`                                          |

Example, an `occupations.csv` adding French:

```csv
ID,PREFERREDLABEL_FR,DESCRIPTION_FR
occ-00123,Cuisinier,Prépare des repas
occ-00456,Plombier,
```

`ALTLABELS_LANGUAGECODE` holds one label per line in the cell, matched to the entity's existing alt labels by
position (line 1 translates alt label 1, and so on). A CSV with more labels than the entity has existing slots
reports a warning and ignores the extras; this tool never adds a new alt label slot.

If you don't have the original import CSV to build from, export the model instead — the export already has the
`ID` column and the right columns/suffixes for every language the model currently has, so it's a valid starting
point to add new language columns to.

## Output

Writes a JSON summary report (`add-language-report.json` by default) containing, per entity type:

- `totalRows`, `matched`, `unmatched`, `unmatchedImportIds`: how many rows matched an existing entity and which
  ones didn't.
- `changed`, `unchanged`: how many matched rows actually differed from what was already stored.
- `writeFailures`: rows that could not be confirmed as written because the database rejected their batch. This
  should always be `0`; if it isn't, `availableLanguages` was deliberately **not** updated, and the command
  exits with an error even though the report was written — re-run it once the underlying database issue is
  resolved.
- `warnings`: non-fatal issues such as alt-label overflow or duplicates.

It also reports `availableLanguagesUpdated` and `embeddingsFollowUpCommand`.

## Model Requirements

The target model must already exist and have been imported previously — this tool only updates entities that are
already there. The CSV's `ID` column must match the `importId` each entity was given at import time, not its
label or code.

## Idempotency

Running the same command twice is safe: the second run compares every value against what's already stored and
reports zero changes. `availableLanguages` is only ever extended, never replaced.

## Troubleshooting

To run it as `./cli.ts ...` directly instead of through `npx ts-node`, `ts-node` must be on your global `PATH`,
and the file must be executable:

```bash
chmod +x cli.ts
./cli.ts --help
```

If that fails with `env: ts-node: No such file or directory`, `ts-node` isn't on your global `PATH` — use
`npx ts-node cli.ts ...` instead, as shown above.

> Note: Use absolute paths
