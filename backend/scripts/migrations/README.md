# Data migrations

One-off scripts that change the shape of the data of a database. They are a sibling of the other scripts of
`backend/scripts/`, they are not part of the deployed bundle and they never run on their own.

## How they are run

Migrations are **run by hand, one at a time, by name**, against the database of `MONGODB_URI`:

```shell
cd backend
export MONGODB_URI="mongodb+srv://..."           # the database to migrate

yarn migrate:list                                 # the migrations that exist
yarn migrate:up 0001-model-info-available-languages
yarn migrate:down 0001-model-info-available-languages
```

The name is the file name of the migration, without the extension. The leading id on its own (`0001`) and the file
name with its extension (`0001-model-info-available-languages.ts`) are accepted too.

## No migration state is kept

Nothing records that a migration ran: there is no state collection, no state file, and the runner never refuses a
migration because it "already ran". Which migrations a database has had applied is part of the runbook of the
deployment, not of the database.

That puts two rules on every migration in this directory:

- **Both directions are idempotent.** They filter on the shape they change, e.g. on the models that have no
  `availableLanguages` yet, so that a second run matches nothing and is a no-op, and so that a run that was
  interrupted halfway can simply be run again.
- **Both directions are safe to run out of order.** A migration never assumes that another one ran before it.

The runner reports how many documents it matched and modified, which is how a run is verified: the first run reports
the documents it changed, an immediate second run reports zero.

## Before running one

- Take a snapshot of the database. A `down` is a revert of a schema change, not a restore of lost data: `0001`'s
  `down` removes `availableLanguages` from every model, including from models that were created with several
  languages after the migration ran.
- Run `0001` before `0003` and `0005`: both read `availableLanguages` to know which language the data of a model is
  in, and fall back to the fall back language for a model that does not declare any.
- Run it against a copy first when the collection is large, and record the duration on the ticket.
- Deploy code that tolerates both shapes before migrating, and the code that reads the new shape after.

## Adding a migration

1. Add `NNNN-what-it-does.ts` to this directory, default exporting an `IMigration` (see `migration.types.ts`).
2. Register it in `migrations.ts` so the runner can find it by name.
3. Give both `up()` and `down()` a filter that makes them idempotent, and return the matched / modified counts.
4. Document it in the table below.

## The migrations

| Name                                      | What it does                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0001-model-info-available-languages`     | Sets `availableLanguages` on every model that does not declare any, to the language its locale implies: `["es"]` when the short code of the locale ends with `es`, e.g. `AR-es`, and `["en"]` otherwise. `down` removes the field from every model.                                                                                                                                           |
| `0002-occupations-localized-fields`       | Rewrites the Occupation collection's translatable fields into localized sub documents. `down` flattens them back to the fallback language.                                                                                                                                                                                                                                                    |
| `0003-occupation-groups-localized-fields` | Rewrites `preferredLabel`, `description` and `altLabels` of every occupation group into localized sub documents keyed by the first language its model declares, e.g. `"x"` into `{ "en": "x" }`. `down` flattens them back to the value of that language. `code` and `groupType` are monolingual and are left untouched. A group whose model no longer exists is left untouched and reported. |
| `0004-skills-localized-fields`            | Rewrites the Skill collection's translatable fields into localized sub documents. `down` flattens them back to the fallback language.                                                                                                                                                                                                                                                         |
| `0005-skill-groups-localized-fields`      | Rewrites `preferredLabel`, `description`, `scopeNote` and `altLabels` of every skill group into localized sub documents keyed by the first language its model declares, e.g. `"x"` into `{ "en": "x" }`. `down` flattens them back to the value of that language. `code` is monolingual and is left untouched. A group whose model no longer exists is left untouched and reported.           |
