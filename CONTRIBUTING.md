# Contributing

This guide will serve as a reference for contributing to the Deephaven.

## Getting the source

Deephaven uses the [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow). In this workflow, the [deephaven/web-client-ui](https://github.com/deephaven/web-client-ui) repository contains a minimum number of branches, and development work happens in user-forked repositories.

To learn more see:

- [Forking Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow)
- [Forking Projects](https://guides.github.com/activities/forking/)
- [Fork A Repo](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo)
- [Working With Forks](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/working-with-forks)

To get started quickly:

1. Navigate to [https://github.com/deephaven/web-client-ui](https://github.com/deephaven/web-client-ui).
2. Click `Fork` in the top right corner.
3. `git clone git@github.com:<username>/web-client-ui.git`
4. In order to use the UI, you must also be running a [deephaven-core](https://github.com/deephaven/deephaven-core) server on port 10000. The server provides APIs that the web-client-ui depends upon. An easy way to get started is to follow the steps for [Launch Python](https://github.com/deephaven/deephaven-core#launch-python).
5. Commit changes to your own branches in your forked repository.

For details on working with git on GitHub, see:

- [Cloning a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Troubleshooting cloning errors](https://docs.github.com/en/repositories/creating-and-managing-repositories/troubleshooting-cloning-errors)
- [Pushing commits to a remote repository](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)

Forked repositories do not have access to the same tokens/secrets as the [deephaven/web-client-ui](https://github.com/deephaven/web-client-ui) repository, so GitHub actions will fail. To disable GitHub actions in your forked repository, go to "Actions" -> "Disable Actions" in your forked repository settings (`https://github.com/<username>/web-client-ui/settings/actions`).

Over time, forks will get out of sync with the upstream repository. To stay up to date, either:

- Navigate to `https://github.com/<username>/web-client-ui` and click on `Fetch upstream`, or
- Follow these directions on [Syncing A Fork](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork).

## Creating a Pull Request

1. Follow the GitHub instructions for [Creating a Pull Request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).
   - Use `deephaven/web-client-ui` as the base repository.
   - Use your own fork, `<username>/web-client-ui` as the repository to push to.
2. Fill in the information in the Pull Request:
   - If you know people who should be reviewers, add them as a reviewer
   - Add yourself as the Assignee
   - PR titles must follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).
     - The `type` provided must be one of [commitizen conventional commit types](https://github.com/commitizen/conventional-commit-types):
       - **feat**: A new feature
       - **fix**: A bug fix
       - **docs**: Documentation only changes
       - **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
       - **refactor**: A code change that neither fixes a bug nor adds a feature
       - **perf**: A code change that improves performance
       - **test**: Adding missing tests or correcting existing tests
       - **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
       - **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
       - **chore**: Other changes that don't modify src or test files
       - **revert**: Reverts a previous commit
     - The `scope` is not required.
   - **BREAKING CHANGE:** if your change breaks an existing API in such a way that users of the package affected will need to make some changes to migrate to the newer version, add the `BREAKING CHANGE:` footer to the PR description, detailing the breakage and any migration instructions necessary, e.g.:
   ```
   BREAKING CHANGE: The API now takes a new parameter that must be provided.
   ```
   - **NOTE:** Do _not_ use the `!` notation for marking a breaking change - you must use the `BREAKING CHANGE:` footer and include details of the breakage/migration.
   - [Link the PR](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) with any associated issues
3. Submit the PR

## Deephaven Contributor License Agreement (CLA)

The [Deephaven Contributor License Agreement (CLA)](https://github.com/deephaven/cla/blob/main/CLA.md) must be accepted before a pull request can be merged. A bot monitors all pull requests. Follow the instructions from the bot in the pull request comments to accept the CLA. The Deephaven CLA and associated signatures are maintained at [https://github.com/deephaven/cla](https://github.com/deephaven/cla).
