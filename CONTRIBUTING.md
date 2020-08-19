# Contribute to Mira

Thank you for taking the time to work on Mira!

This section contains guidelines on how you can contribute to the Mira project and how to manage its release cycle.

## Propose a Change

Always use a Pull Request(PR) to make changes to the codebase in this repository. Use branches that describe the change, for example:

* 🌟 `feature/anything` for a new feature.
* 🐛 `fix/anything` for a fix.
* 📓 `docs/anything` for documentation.
* 🧹 `chore/anything` for a chore (for example: release or restructure).

Ensure all your tests pass and linting is successful before opening a PR. 


# Maintainers
## Release Mira

ℹ️ _Before a release can be published, ensure you have followed the instructions in the documentation: [Creating and publishing unscoped public packages]._

Each release consists of three steps:

1. Update the auto-generated documentation and package version, then commit them to the repository.
2. Tag the package version commit with the same version number.
3. Publish the new version of the package to NPM Packages.

At the end of the release, there should be a commit on `master` tagged with the package version, and the package is published to the NPM packages repository in this git repository.

### 1. Update the Package Version and Documentation

Ensure you are on the `master` branch, have pulled the latest version, and there are no outstanding changes.

```bash
git checkout master
git pull
```

Let's assume the current version is `1.0.0` and you wish to set the version to `1.1.0`. Use the [`npm version`][npm version] command to automatically update the `package.json` and lock file.

The `npm version` command updates the minor version using the `minor` command, but because you need to open a Pull Request, you do not want the automatic git commit and tagging feature. Disable this with `--no-git-tag-version` as follows:

```bash
npm version --no-git-tag-version minor
```

This changes `package.json` and `package-lock.json` to have the new version `1.1.0`. Checkout a new branch, regenerate the documentation and then commit these changes with the following commands:

```bash
git checkout -B chore/version-1.1.0
npm run typedoc
git add -A
git commit -m '1.1.0'
git push -u origin HEAD
```

Open a Pull Request for this new branch and wait for approval. Once approved, use a **Squash Merge** with the commit message **`1.1.0`**

ℹ️ _The commit message represents the version number at that point in time. Setting this to just the version number helps track down these specific commits. Note: This does not follow the [Conventional Commits] style, but does align with the `npm version` style_.

### 2. Tag the Package Version Commit

Pull the changes locally and make sure your local HEAD points to the merge commit of the PR.

```bash
% git fetch origin
% git checkout origin/master
% git log --pretty=oneline -5
3axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 1.1.0
# ... other commits
```

If there are merges since, checkout the commit for the merge in step 1 above.

```bash
git checkout 3axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Now simply tag the version using git and push it.

```bash
git tag v1.1.0
git push origin v1.1.0 # note the `v`
```

### 3. Publish to NPM Packages

Now that your tag is pushed, you can publish the package. Make sure the repository is clean and node modules are installed correctly.

```bash
git clean -xfd
npm ci --prefer-offline
```

Now publish as follows:

```bash
npm publish
```

This lints, builds and tests the package, then publishes it to NPM. You can view the package on the [Mira packages page][Mira packages].

[Creating and publishing unscoped public packages]: https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages
[npm version]: https://docs.npmjs.com/cli-commands/version.html
[Conventional Commits]: https://www.conventionalcommits.org/
[Mira packages]: https://www.npmjs.com/package/mira?activeTab=versions
