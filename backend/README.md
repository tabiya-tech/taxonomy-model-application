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

## Testing

To run the test cases for the application, execute the following command:

```
yarn test
```

## Building

To build the backend application, execute the following command:

```
yarn build
```

## Linting

To run the linter, execute the following command:

```
yarn lint
```

## Contributing

Contributions are highly valued in this project. 

In addition to the [contribution guidelines](/README.md#contribution-guidelines) mentioned in the parent directory, please follow these specific rules while working on the frontend project:

- Before pushing your work, make sure to:
  - [Run the linter](#linting)
  - [Build the application](#building)
  - [Test your code](#testing)