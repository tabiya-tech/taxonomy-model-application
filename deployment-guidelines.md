# Taxonomy Model App - Deployment Guidelines

> Here are the guidelines for deploying the Taxonomy Model Application. These instructions will help you set up the app in development, testing, and production environments. By following these steps, you can ensure a smooth deployment process, ensuring the app operates efficiently and meets the required standards for each environment. Whether you are in the development phase, conducting testing, or deploying to production.


## Deploying on development environment

Any push to the main branch are automatically deployed to the development environment. It may be a commit pushed directly to the main or a pull request merged into main. This process ensures that the latest updates are always tested in a live setting. By doing so, it allows for immediate identification and resolution of any issues that may arise.

## Deploying on testing environment

To deploy the app on the testing environment, you have two options

1. [Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging): Create a tag and push a tag. a tag must follow [Semantic Versioning 2.0.0](https://semver.org/) format. With v at the beginning. For example vZ.Y.X-....
2. [Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases): Create a release on the repository, this is going to trigger a deployment to the testing environment.

After the deployment on test, a step that requires approval is going to be initiated, this deployment is going to be approved by the QA team, and it will trigger [deployment to production](#deploying-on-production-environment)

## Deploying on production environment

After the deployment on test, a step that requires approval is going to be initiated, once Approved deployment to production is going to follow up. but when it is rejected. no deployment is going to happen. We used [GitHub Protection rules](https://docs.github.com/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules) to enforce this on the confirmation environments.

## Sanity checks.

Before deploying to any environment, make sure you have run the following checks:

- **Code Coverage**: 100%
- **Bugs**: 0
- **Security Rating**: A
- **Reliability Rating**: A
- **Maintainability Rating**: A
- **Security Hotspots Reviewed**: 100%

### Checks for development environment

- **Unity tests**: 100%
- **Integration tests**: 100%
- **End-to-End tests**: 100%
- **Smoke tests**: 100%
- **Sonarcloud**: 100%

### Checks for testing environment

> Before deployment on test, we pull the production data to the test environment to make sure the data is up-to-date.
> Check the job that handles this to understand more about the logic [copy-database.yml](.github/workflows/copy-database.yml)

- all the checks for the development environment
- **a tag(version) must follow [Semantic Versioning 2.0.0](https://semver.org/) format. With v at the beginning. For example vZ.Y.X-....**
- **A release must be created on the repository**
- **a version must be greater than the last version deployed to the testing environment**

### Checks for production environment

- **The tested version by test environment must be the same as the version deployed to the production environment**
- **a version must be greater than the last version deployed to the testing environment**

## Current Deployed Endpoints.

- **Development**: [https://dev.platform.tabiya.tech](https://dev.platform.tabiya.tech)
- **Testing**: [https://test.platform.tabiya.tech](https://test.platform.tabiya.tech)
- **Production**: [https://platform.tabiya.tech](https://platform.tabiya.tech)
