# api-specifications

The "api-specifications" project provides JSON schemas and TypeScript types for the backend REST API. It should be used to ensure consistency across different parts of the codebase.

## How to use 

Install the package by first run `yarn link` in the `dist` folder of the project, then `yarn link api-specifications` in the project you want to use it in.

See also the `link-api-specifications.sh` script in the root of the repository.

After that you can import the types and schemas in your code, for example:

```typescript
import { ModelInfoResponseSchema, IModelInfoResponse } from 'api-specifications/dist/modelInfo/';

```
