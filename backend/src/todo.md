## General

- Move common files to "server" folder
- move regex from api-specifications

## Index.ts

- update openAPI to reflect the actual specification
- add ErrorCode to the api-specifications project
- error does not match the api-specifications of an error
- Define better ErrorCodes
- Try Catch on the JSON Parse
- Look into ParseValidationError and document why it is needed.
- const newModelInfoSpec: INewModelInfoSpec = payload as INewModelInfoSpec; -> Actually it is a ModelRequest
- Integration Test
- Constrain the create function to only accept the ModelRequest

## Index.test.ts

- rename handler to index.test.ts
- use mock to mock the database, and the validation function
- write an in memory integration test for the CREATED ( 201 ) status code
