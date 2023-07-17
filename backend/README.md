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

To run this application locally, follow these steps:

1. Ensure you have the [prerequisites](#prerequisites) installed before proceeding.
2. Clone the repository:
    - Using https:

        ```
        git clone https://github.com/tabiya-tech/taxonomy-model-application.git
        ```
    - Using ssh:

        ```
        git clone git@github.com:tabiya-tech/taxonomy-model-application.git
        ```
3. Navigate to the backend directory:

    ```
    cd ./backend
    ```

4. Install the project's dependecies:

    ```
    yarn install
    ```

    After installing the dependencies, the `postinstall` script mentionned in the [package.json](/backend/package.json) will run immediately, installing [api-specifications](/api-specifications/readme.md) dependecies.

## Testing

To run the test cases for the application, execute the following command:

```
yarn test
```

## Building

To build the backend application, use the following command:

```
yarn build
```

## Linting

Run the linter using the following command:

```
yarn lint
```

## Contributing

Contributions are highly valued in this project as they drive its growth and progress. Please follow these specific rules while working on the project:

1. Before pushing or merging your work, make sure to:
    - [Run Linter](#linting)
    - Compile Typescript with the following command:

        ```
        yarn compile
        ```
    - [Test your code](#testing)
    
2. Follow the [semantic commit messages](https://www.conventionalcommits.org/en/v1.0.0/) rules