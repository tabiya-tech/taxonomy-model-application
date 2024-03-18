[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=tabiya-tech_taxonomy-model-application&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=tabiya-tech_taxonomy-model-application&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=tabiya-tech_taxonomy-model-application&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=tabiya-tech_taxonomy-model-application&metric=bugs)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=tabiya-tech_taxonomy-model-application&metric=coverage)](https://sonarcloud.io/summary/new_code?id=tabiya-tech_taxonomy-model-application)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


# Taxonomy Model App

Welcome to the Taxonomy Model App! This open-source project enables users to seamlessly explore and modify taxonomy models within the platform.

## Project Overview

The Taxonomy Model App is a crucial component of our platform, allowing users to interact with and enhance taxonomy models. Taxonomy models play a pivotal role in organizing and categorizing data effectively. By contributing to this project, you'll be helping improve data organization and accessibility.

## Table of Contents

- **[API Specifications](api-specifications)**: Explore the API Specifications directory for detailed insights into the API documentation.
- **[Infrastructure As Code (IaC)](iac)**: Explore the Infrastructure as code(IAC) directory for detailed insights about the infrastructure-as-code components.
- **[Frontend](frontend)**: Explore the Frontend directory for detailed insights about the frontend react project.
- **[Backend](backend)**: Explore the Backend directory for detailed insights about the backend Node.js project.
- **[Contribution Guidelines](#contribution-guidelines)**: Help us improve the project by contributing to various aspects.
- **[Getting Started](#getting-started)**: Easy steps to set up your environment and start contributing.
- **[License](#license)**: The project is licensed under MIT License.
- **[@tabiya/prettier-config](%40tabiya%2Fprettier-config)**: The configuration for [prettier](#code-formatting).
## Architecture Overview
The image below shows a high level overview of the solution architecture of the Taxonomy Model App.

![Tabiya Architecture Overview](https://lucid.app/publicSegments/view/7dc82517-6cc1-4920-9eb0-b1c8f8f8b807/image.png)

There is a more detailed architecture diagram in the [IaC Readme](iac/README.md).

## Database Schema
The image below shows an overview of the Database Schema of the Taxonomy Model App.

![Tabiya Database Schema](https://lucid.app/publicSegments/view/7435b2f5-cdcc-4fcc-8db1-6cf15438d2ed/image.png)

## Why Contribute?

- **Make an Impact:** Your contributions will directly improve the user experience and functionality of our platform.
- **Help achieve our goals:** Help improve the lives of individuals by assisting in our goal of provide access to labor market taxonomy data that is critical to job availability in lower and middle income countries

## Ways to Contribute

1. **Reporting Issues:** If you encounter bugs or have suggestions, don't hesitate to open an issue on GitHub. Your feedback is valuable.
2. **Code Contributions:** Help us enhance the codebase by submitting pull requests. 
3. **Write/Improve Tests:** We are aiming at 100% code coverage for our code. You can help us achieve this goal by writing/improving tests.
4. **Documentation:** Improve project documentation by submitting pull requests. Clear documentation is crucial for new contributors.
5. **Support:** Give the project a star on GitHub – your support encourages us to keep improving!

## Contribution Guidelines

🎉 Thank you for considering contributing to the Taxonomy Model App! 🎉

### Code Quality

We aim to achieve the following metrics on SonarCloud:

- **Code Coverage**: 100%
- **Bugs**: 0
- **Security Rating**: A
- **Reliability Rating**: A
- **Maintainability Rating**: A
- **Security Hotspots Reviewed**: 100%


> Note: To run sonarcloud analysis locally you need to do the following:
> 1. set the SONAR_TOKEN environment variable to your sonarcloud token
> 2. ensure you have installed the sonar-scanner cli tool by running the following command at the projects root directory:
>   ```bash
>    yarn install
>    ```
> 3. run the sonarcloud the following command:
>    ```bash
>    yarn run sonar:local
>    ```
   
### **Code Formatting**

We follow the **[Prettier](https://prettier.io/)** code formatting guidelines to make sure the code is properly formatted in a uniform way.

You can find the configuration in the **[.prettierrc.json](@tabiya/prettier-config/.prettierrc.json)** file.

> **Note:**  
For Intellij IDEA, if you make any changes to the prettier config file, you many have to restart your IDE to make sure the changes are applied, before you can format the code using the IDE's formatting function.

### Conventional Commits

Please follow the **[Conventional Commits](https://www.conventionalcommits.org/)** format for your commit messages.

### Guidelines for Readable BDD Testing

To contribute to our 100% code coverage goal, refer to our "Guidelines for Readable BDD Testing" in the **[testing-guidelines.md](testing-guidelines.md)**

### Guidelines for Log assertions
To ensure component stability, refer to our "Guidelines for log assertions" in the **[log-assertions-guidelines.md](log-assertions-guidelines.md)**
### Guidelines for Snapshot Testing 

To ensure component stability, refer to our "Snapshot Testing Guidelines" in the **[snapshot-testing-guidelines.md](snapshot-testing-guidelines.md)**

## Getting Started
To work with this repository you should have a system with a bash compatible terminal (linux, macOS, cygwin) as most of the scripts are written for bash and will not work on windows cmd or powershell. 

1. Fork the repository and clone it to your local environment.

2. Create a new branch for your changes.

3. After making your changes, ensure the code is clean, properly formatted and passes all tests.

    You can use the provided script, `run-before-merge.sh`, for assistance. This script performs checking of the code formatting, linting, building, and testing on the subprojects of the repository. The script also supports running sonarcloud analysis locally for the current branch and checks if it passes the quality gates. To run it, use the following command:
    
    ```bash
    ./run-before-merge.sh
    ```
   
   If you get any errors, fix them before proceeding.

4. Commit them, and push to your fork.

5. Use descriptive commit messages following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

6. Open a pull request to our main branch.

Happy contributing! 🚀

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.


