# Locales

### About
This repository contains the locales configurations for the application.

> **A Locale in the context of the platform:** A locale is a set of parameters which defines on which region the application is running, this includes the region and the language on which the model is in.

## Prerequisites

To set up locales project locally, you must install the following:

* [Node.js ^16.0](https://nodejs.org/dist/latest-v16.x/)
* [Yarn ^1.22](https://classic.yarnpkg.com/en/)
* A recent version of [git](https://git-scm.com/) (e.g. ^2.37 )

### Technologies

- [Node.js](https://nodejs.org)
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [AJV](https://ajv.js.org/)


## Installation

To develop this application locally, follow these steps:

1. Ensure you have the [prerequisites](#prerequisites) installed before proceeding.

2. Clone the repository

3. Navigate to the locales directory:

    ```
    cd ./locales
    ```

4. Install the project's dependencies:

    ```
    yarn install
    ```

   After running the above command, the `postinstall` script in the [package.json](package.json) will also run, and it will build and link the [api-specifications](/api-specifications/readme.md) dependency.


## Testing

### Unit Tests

To run the unit test cases for the application, execute the following command:

```
yarn test
```


## Linting

To run the linter, execute the following command:

```
yarn lint
```

### 

### Definition of a Locale.
```typescript
type Locale =  {
    name: string; // The name of the locale eg: Europe (French)
    shortCode: string; // The short code of the locale eg: EU-fr
    UUID: string; // The UUID of the locale eg: 8e763c32-4c21-449c-dddd-7ddeb379369a
}
```


### 

### Locales Codebase Components
The locales project has two folders.

- [Public](public): This is a folder that contains the locales that are available to the public.
- [Tests](tests): This is a folder that contains the tests for the locales.

### Contributing

Contributions are highly valued in this project.

In addition to the [contribution guidelines](/README.md#contribution-guidelines) mentioned in the parent directory, please follow these specific rules while working on the frontend project:

- Before pushing your work, make sure to:
    - [Run the linter](#linting)
    - [Test your code](#testing)

#### 1. adding a new locale

1. Go to the `public` folder.
2. add a new locale in the file [locales.json](public/locales.json)
3. Run the tests to make sure that the locale is valid by running `npm run test`
