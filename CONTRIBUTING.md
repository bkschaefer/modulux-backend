# Contributor Guide

Welcome, and thank you for your interest in contributing to Modulux!
Below, you will find the essential information about local setup, coding guidelines, development workflow, and deployment.

Please note we have a [code of conduct](#code-of-conduct), please follow it in all your interactions with the project.

## 1. Prerequisites

* [Node.js](https://nodejs.org/en) (>=18)
* [npm](https://www.npmjs.com/) (>=8)
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/) (for containerized builds and local testing)

## 2. Project Structure

* `src/` – Contains the main Express application code.
  * `src/errors` – Contains custom error classes used by the service layer to respond with meaningful errors.
  * `src/helper` – Utility functions.
  * `src/middleware` – Contains all middleware, each in its own file.
  * `src/model` – Contains all Mongoose models, one model per file. Each file should end with `.model.ts`.
  * `src/routes` – Contains all `express.Router` instances, grouped roughly by use case.
  * `src/service` – Contains all service-layer functions.
  * `src/types` – Contains all application-wide type declarations. Each file should end with `.type.ts`.
  * `src/test` – Contains all Jest tests.

## 3. Cloning the Repository & Starting Development

1. Clone the repository

```bash
git clone git@github.com:bkschaefer/modulux-backend.git
cd modulux-backend
```

2. Install dependencies

```bash
npm install
```

4. Start the development database

```bash
docker compose up -d
```

5. Start the development server

```bash
npm run dev
```

## 4. Coding Guidelines

1. Code Style
   * We use [ESLint](https://eslint.org/) for linting.
   * A pre-commit hook with [prettier](https://prettier.io/) is configured with the standard configuration.
   * Keep your code clear and well-documented.
   
2. TypeScript 
   * Make sure to use **strict typing**.
   * Avoid unused or `any` types whenever possible.

3. Commits & Messages
   * Provide **descriptive commit messages**.
   * Consider using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g., `feat: add new login page`, `fix: correct session timeout logic`).

The project maintains a **CHANGELOG.md** file to document all changes across different releases. This file provides a detailed record of new features, bug fixes, and other modifications, ensuring that both developers and users can easily track the project's evolution. By adhering to Semantic Versioning (semver), we ensure that our version numbers clearly communicate the scope and impact of changes with each update.

## 5. Branching

Please **do not** work directly on the `master` branch.  
Create a dedicated feature branch (e.g., `feature/login-page`) for your changes to keep the commit history clean.  
For small fixes, working in the `development` branch is ok.

## 6. Tests

We highly encourage the development of Jest tests for new features. Implementing tests not only helps ensure that our code remains robust and maintainable but also facilitates smoother integration and collaboration within the team.


## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, gender identity and expression, level of experience,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

* The use of sexualized language or imagery and unwelcome sexual attention or
advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic
  address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable
behavior and are expected to take appropriate and fair corrective action in
response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, wiki edits, issues, and other contributions
that are not aligned to this Code of Conduct, or to ban temporarily or
permanently any contributor for other behaviors that they deem inappropriate,
threatening, offensive, or harmful.

### Scope

This Code of Conduct applies both within project spaces and in public spaces
when an individual is representing the project or its community. Examples of
representing a project or community include using an official project e-mail
address, posting via an official social media account, or acting as an appointed
representative at an online or offline event. Representation of a project may be
further defined and clarified by project maintainers.

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by opening an issue on our [GitHub Issues](https://github.com/bkschaefer/modulux-backend/issues) page. All
complaints will be reviewed and investigated and will result in a response that
is deemed necessary and appropriate to the circumstances. The project team is
obligated to maintain confidentiality with regard to the reporter of an incident.
Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good
faith may face temporary or permanent repercussions as determined by other
members of the project's leadership.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4,
available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/