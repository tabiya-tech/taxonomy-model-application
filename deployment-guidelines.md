# Taxonomy Model App - Deployment Guidelines

> Here are the guidelines for deploying the Taxonomy Model Application. 
> These instructions will help you set up the app in development, testing, and production environments.

## Sanity checks.

Before deploying to any environment, make sure the following checks passes.

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

> 1. Before deployment on test, we pull the production data to the test environment to make sure the data is up-to-date.
> Check the job that handles this to understand more about the logic [copy-database.yml](.github/workflows/copy-database.yml)

- All the checks for the development environment
- **The new tag(version) must follow [Semantic Versioning 2.0.0](https://semver.org/) format. With v at the beginning. For example vZ.Y.X-....**
- **The release must be created on the repository**
- **The version must be greater than the last version deployed to the testing environment**

### Checks for production environment 🚀

- **The tested version by test environment must be the same as the version deployed to the production environment**
- **The new version must be greater than or equal to the last version deployed to the testing environment**


## Deploying on development environment

Any push to the main branch are automatically deployed to the development environment. It may be a commit pushed directly to the main or a pull request merged into main. This process ensures that the latest updates are always tested in a live setting. By doing so, it allows for immediate identification and resolution of any issues that may arise.

## Deploying on testing environment

To deploy the app on the testing environment, you have two options

1. Tagging
   > Create a tag on the main branch and push a tag. A tag must follow [Semantic Versioning 2.0.0](https://semver.org/) format. With v at the beginning. For example vZ.Y.X-....
   >   
   > For more information on creating and sharing tags check [the documentation](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
2. Releases
   > You can also create a tag from release where you create a new tag. 
   > 
   > For more information check [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases): Create a release on the repository, this is going to trigger a deployment to the testing environment.

> **Notes**:
> Creating a release from an already existing tag won't trigger a deployment to the testing environment. As the deployment was already triggered when the tag was created. But you can re-deploy by refreshing the deployment on the [GitHub Actions page](https://github.com/tabiya-tech/taxonomy-model-application/actions).

## Deploying on production environment

After the deployment on test, a step that requires approval is going to be initiated, once Approved deployment to production is going to follow up. but when it is rejected. no deployment is going to happen. We used [GitHub Protection rules](https://docs.github.com/en/actions/deployment/protecting-deployments/creating-custom-deployment-protection-rules) to enforce this on the confirmation environments.

## Current Deployed Endpoints.

- **Development**: [https://dev.taxonomy.tabiya.tech](https://dev.taxonomy.tabiya.tech)
- **Testing**: [https://test.taxonomy.tabiya.tech](https://test.taxonomy.tabiya.tech)
- **Production**: [https://taxonomy.tabiya.tech](https://taxonomy.tabiya.tech)
