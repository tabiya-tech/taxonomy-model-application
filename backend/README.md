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

_For more information check the IaC [README](iac)_


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
## Import  Export CSV format documentation

The import and export of the CSV format documentation can be found [here](/Import_Export_CSV_format.md)

## Contributing

Contributions are highly valued in this project. 

In addition to the [contribution guidelines](/README.md#contribution-guidelines) mentioned in the parent directory, please follow these specific rules while working on the frontend project:

- Before pushing your work, make sure to:
  - [Run the linter](#linting)
  - [Build the application](#building)
  - [Test your code](#testing)
