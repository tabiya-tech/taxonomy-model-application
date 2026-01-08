### Authentication and Authorization

Taxonomy model API is secured with RBAC. Users must authenticate using OAuth 2.0 JWT Tokens or API Keys.

### Roles:

We have different roles in the application: -

**Examples:-**
- anonymous: For Guest/Anonymous users.
- registered-users: For Registered users.
- model-managers: For Model Managers.

See: [AuthAPISpecs.Enums.TabiyaRoles](/api-specifications/src/auth/enums.ts#AuthEnums.TabiyaRoles) 


### Authentication

The API supports two authentication methods:

1. JWT
   1. Human-in-the-loop: issued for end-users (interactive use)
   2. Machine-to-machine: issued for system integrations
2. API Key (associated with usage plans and quotas)

> One of these methods is required for any request.

### Authorization

1. Human-in-the-loop Roles:
   - Roles:
     - ANONYMOUS
     - REGISTERED_USER
     - MODEL_MANAGER

   - Access:
     - ANONYMOUS / REGISTERED_USER: read-only access
     - MODEL MANAGER: read and write access

2. Machine-to-machine Roles:
   - Fine-grained control with scoped read/write access to resources
   - Clients are associated with users
   - Only MODEL_MANAGER users can issue write scopes
   - Not subject to usage plans or quotas

3. API Key
   - Read API Key: available to roles with read access
   - Write API Key: only available to users with the MODEL MANAGER role


### How to

#### 1. Create an API Key

To create an API Key, you need to follow the [guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-setup-api-keys.html). Note that you need to set up a usage plan and associate it with an API method. 

After you will need to whitelist the API Key by its ID using the [script](/backend/src/scripts/whiteListAccessKey/index.ts).

#### 2. Create a M2M Client.

To create an M2M client, you need to follow the [guide](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html). Note that you need to set up a usage plan and associate it with an API method.

After you will need to whitelist the M2M client by its client id using the [script](/backend/src/scripts/whiteListAccessKey/index.ts).


> When whitelisting, you will associate with a role, this will be the role used for authorization.
