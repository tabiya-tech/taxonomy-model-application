# TAXONOMY MODEL APP

## About

This is the backend of the Taxonomy Model App.

## Prerequisites

To develop the backend locally, you must install the following:

* [Node.js ^16.0](https://nodejs.org/dist/latest-v16.x/)
* [Yarn ^1.22](https://classic.yarnpkg.com/en/) 
* A recent version of [git](https://git-scm.com/) (e.g. ^2.37 )

## Technologies

- [Node.js](https://nodejs.org)
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [AJV](https://ajv.js.org/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

## Installation

To develop this application locally, follow these steps:

1. Ensure you have the [prerequisites](#prerequisites) installed before proceeding.

2. Clone the repository

3. Navigate to the backend directory:

    ```
    cd ./backend
    ```

4. Install the project's dependencies:

    ```
    yarn install
    ```

   After running the above command, the `postinstall` script in the [package.json](package.json) will also run, and it will build and link the [api-specifications](/api-specifications/readme.md) dependency.

## Running

The backend project can't be run locally.

>It is specifically designed for deployment on [AWS Lambda](https://aws.amazon.com/lambda/), utilizing [pulumi](https://www.pulumi.com) for its construction. It is composed of aws, Lambda functions, which are not designed for local execution. 

_For more information check the IaC [README](../iac/README.md)_


## Testing
### Unit Tests
To run the unit test cases for the application, execute the following command:

```
yarn test
```

> **Note:**    
> Code coverage is generated based on the unit tests.

### Integration Tests
To run the integration test cases for the application, execute the following command:

```
yarn test:integration
```

> **Note:**    
> Integration tests do not generate code coverage.

## Building

To build the backend application, execute the following command:

```
yarn build
```

> **Note:**
> We are using [esbuild](https://esbuild.github.io/) to build the backend code. 
>
>It generates multiple bundles for the application, which can then be deployed to separate AWS Lambdas, see [creating a .zip deployment package with no dependencies](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html#nodejs-package-create-no-dependencies).
> 
> It uses tree-shaking, and bundles ESM and CJS modules, and the produced bundles contain all runtime dependencies, independently of where they are declared (e.g. in the `dependencies` or `devDependencies` section of the [package.json](package.json) file). However, we do declare the dependencies is the correct section for the shake of clarity and to avoid confusion.
>
> Additionally, even though the [AWS Lambda environment includes the AWS SDK](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html), we still include it in the bundles to ensure that the correct version is used.
> By doing so, under the [AWS shared responsibility model](https://docs.aws.amazon.com/whitepapers/latest/aws-risk-and-compliance/shared-responsibility-model.html), we are responsible for the management of the  dependency in our functions.
> 
## Linting

To run the linter, execute the following command:

```
yarn lint
```

## OpenAPI Documentation

The [OpenAPI](https://spec.openapis.org/oas/v3.1.0) documentation for the backend is generated using the [Swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc) library. The documentation is generated from comments annotated with `@openapi`. For additional information, see the [generateOpenApiDoc.ts](openapi/generateOpenApiDoc.ts) file.

The API documentation is available in both [Swagger UI](https://swagger.io/tools/swagger-ui/) and [Redoc](https://redocly.com/redoc/).

To generate the documentation locally, you can use the following commands:
```
yarn generate:openapi
yarn generate:swagger
yarn generate:redoc
```

To view the documentation locally, run:

```
yarn local-server:openapi
```

## Database Schema
The image below shows an overview of the Database Schema of the Taxonomy Model App.

![Tabiya Database Schema](https://lucid.app/publicSegments/view/7435b2f5-cdcc-4fcc-8db1-6cf15438d2ed/image.png)

## Import  Export CSV format documentation

The import and export of the CSV format documentation can be found [here](Import_Export_CSV_format.md)

## Construction of hierarchies

When constructing hierarchies (either occupation hierarchies or skill hierarchies) use the guide [here](taxonomy-hierarchy.md)

## Languages

The languages the platform knows about are defined in the language registry of the api-specifications, see its [README](../api-specifications/src/language/README.md), which also has the checklist for adding a language. A model declares the languages it has data in in its `availableLanguages`, and every translatable field of an entity is stored as a sub document keyed by the `dbKeyName` of the language, e.g. `{ "en": "Cook", "fr": "Cuisinier" }`.

### The Accept-Language contract

The `GET` endpoints of the occupations, the occupation groups and the skills, including their sub resources (e.g. `/children`, `/history`), are served in a single language, chosen from the `Accept-Language` header of the request. The resolution is implemented in [resolveLanguage.ts](src/common/language/resolveLanguage.ts):

- The candidates are the languages of the model's `availableLanguages` that are in the registry, in the order of the model.
- The header is read as defined in [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#name-accept-language): the ranges are tried by descending quality, ties are broken by their position in the header, and a range with `q=0` is skipped.
- A range matches a candidate by its exact short code first, and by its primary sub tag second, e.g. `fr-CH` is served `fr`. The matching is case insensitive.
- The `*` range is served the fall back language when the model has it, and the first language of the model otherwise.
- No header, no match, or a model that has no language of the registry is served the fall back language, `en` unless the `FALLBACK_LANGUAGE` environment variable of the backend names another language of the registry.
- A malformed header or range never fails the request, it is ignored.
- **A released model is always served the fall back language**, whatever the header says.

Within the served language, every field falls back on its own: a field that is not translated in the served language carries the value of the fall back language, and an empty string when neither is translated. An item of a list, e.g. of the `altLabels`, that is translated in neither is dropped.

Every such response carries the `Content-Language` header, with the short code of the language it was served in, and `Vary: Accept-Language`. A client reads the language of the response from `Content-Language`, not from what it asked for.

The `GET` endpoints of the skill groups do not read `Accept-Language` yet. The `POST`, `PATCH` and `PUT` endpoints do not read it, they take the translatable fields as a value per language.

## Data migrations

Changes to the shape of the data of a database are applied by the migrations of [scripts/migrations](scripts/migrations/README.md). They are not part of the deployed bundle and no pipeline runs them, they are **run by hand, one at a time, by name**, against the database of `MONGODB_URI`:

```
export MONGODB_URI="mongodb+srv://..."

yarn migrate:list
yarn migrate:up <name>
yarn migrate:down <name>
```

No migration state is kept in the database, every migration is idempotent and reports how many documents it matched and modified. See the [migrations README](scripts/migrations/README.md) for the rules every migration follows and for what each one does.

### The order of the migrations

Run the migrations in the order of their id:

1. `0001-model-info-available-languages`, it must run before `0003` and `0005`, which read `availableLanguages` to know which language the data of a model is in.
2. `0002-occupations-localized-fields`
3. `0003-occupation-groups-localized-fields`
4. `0004-skills-localized-fields`
5. `0005-skill-groups-localized-fields`
6. `0006-entity-embeddings-language`, followed by the recreation of the vector search indexes, see step 6 of the runbook.

### Snapshot before you run

**Take a snapshot of the database before every run**, of `up` and of `down`. A `down` reverts a change of shape, it does not restore data: e.g. `0001`'s `down` removes `availableLanguages` from every model, including from the models that were created with several languages after the migration ran, and the localized fields migrations flatten every translatable field to a single language. The snapshot is the only way back to the data as it was.

### Runbook

For each environment, development, then testing, then production:

1. Check that the code deployed to the environment tolerates both the old and the new shape of the data, see the [deployment guidelines](../deployment-guidelines.md#deploying-a-change-that-needs-a-data-migration).
2. Take a snapshot of the database.
3. Point `MONGODB_URI` at the database of the environment, and run `yarn migrate:list` to check the migrations the runner knows about.
4. When the collections are large, run the migrations against a copy of the database first, and record how long they take on the ticket.
5. Run `yarn migrate:up <name>` for each migration, in [the order of the migrations](#the-order-of-the-migrations). Check the matched and modified counts it reports, then run it a second time: the second run must report 0 modified documents.
6. After `0006`, drop the four `*_embeddings_vector_index` vector search indexes in Atlas and run `yarn create:vector-index` to recreate them with the `language` filter. The script leaves an index that already exists untouched.
7. Record on the ticket which migrations ran against the environment, the source of truth of which migrations a database has had applied.
8. Deploy the code that reads the new shape.

To roll back, deploy code that tolerates both shapes first, then either restore the snapshot, or run `yarn migrate:down <name>` in the reverse order. Before `0006` down, delete the embeddings of every language but the fall back language, see [After running one](scripts/migrations/README.md#after-running-one).

## Contributing

Contributions are highly valued in this project. 

In addition to the [contribution guidelines](/README.md#contribution-guidelines) mentioned in the parent directory, please follow these specific rules while working on the frontend project:

- Before pushing your work, make sure to:
  - [Run the linter](#linting)
  - [Build the application](#building)
  - [Test your code](#testing)
