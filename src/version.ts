import chalk from 'chalk'
import fs from 'fs'
import FileHelpers from './filehelpers'
// eslint-disable-next-line
const minimist = require("minimist");

const args = minimist(process.argv.slice(2))

/**
 * MiraVersion checks the CDK version consistency across the Mira packge and the
 * applications using Mira.  It is capable of force-patching package.json files
 * and running the NPM install.
 */
export class MiraVersion {
    static instance: MiraVersion
    constructor () {
      if (!MiraVersion.instance) {
        MiraVersion.instance = this
      }
    }

    /**
     * Checks a particular dependency CDK version.
     */
    /* eslint-disable-next-line */
    checkApplicationDependencyCDKVersion (pkg: any, dep: string, autoFix = true): boolean {
      if (!dep.startsWith('@aws-cdk') && !dep.startsWith('aws-cdk')) {
        return false
      }
      const cdkVersion = pkg.dependencies[dep]
      const miraVersion = this.getLocalMiraCDKVersion()
      if (typeof miraVersion !== 'string') {
        throw new Error('Mira contains CDK version issues.')
      }
      try {
        this.checkDependency(cdkVersion, dep, miraVersion, 'Mira')
      } catch (e) {
        console.info(`${chalk.cyan('Info:')} Found a version mismatch between Mira and ${pkg.name}.` +
                `\n\t${pkg.name} is ${cdkVersion}` +
                `\n\tMira is ${miraVersion}`)
        if (autoFix) {
          pkg.dependencies[dep] = miraVersion
          return true
        }
      }
      return false
    }

    /**
     * Gets the version of CDK used by an application.  If there is a version
     * mismatch, then modifies the package.json file of the application, informs
     * the user and exits.
     */
    checkApplicationCDKVersion (autoFix = true): void {
      const pkgFile = FileHelpers.getPackageDirectory() + '/package.json'
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))

      let madeChange = false
      for (const dep in pkg.dependencies) {
        madeChange = madeChange || this.checkApplicationDependencyCDKVersion(pkg, dep)
      }
      if (autoFix && madeChange) {
        console.info(chalk.magenta('Patching'), 'package.json to match Mira CDK version: ', this.getLocalMiraCDKVersion())
        fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2))
        console.info(chalk.green('Success'), 'Patched package.json, please re-run `npm install`.')
        process.exit()
      }
    }

    /**
     * Checks a dependency such that it has no wildcards in use.  Optionally
     * checks against an otherVersion.
     */
    checkDependency (version: string, dep?: string, otherVersion?: string, otherDep?: string): boolean {
      if (version.match(/[~^]/g) !== null) {
        throw new Error(`${chalk.red('Version Error')}: The version of Mira use contains wildcard versions via 'aws-cdk'`)
      }
      if (otherVersion && version !== otherVersion) {
        throw new Error(`${chalk.red('Version Error')}: Mira is using mismatched CDK dependency versions (${otherDep} is ${otherVersion} and ${dep} is ${version})`)
      } else if (otherVersion && dep !== undefined) {
        this.checkNodeModuleDependency(dep, otherVersion)
      }
      return true
    }

    /**
     * Checks the local Mira dependencies when Mira has been installed as part
     * of an app such that all Mira CDK deps should be installed as peer deps
     * and also checks that any leftover CDK deps within Mira (not present in
     * the app) are the same expected version as Mira specifies.
     */
    /* eslint-disable-next-line */
    checkLocalMiraCDKDependencies(version: string, pkg: any): void {
      const pkgDir = `${FileHelpers.getPackageDirectory()}/node_modules/mira`
      if (typeof pkgDir !== 'string') {
        return
      }
      if (!fs.existsSync(`${pkgDir}/node_modules`)) {
        // Nothing to check, no Mira `node_modules`.
        return
      }
      if (args['ignore-version-errors'] !== undefined) {
        return
      }
      const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies)
      for (const dep in deps) {
        if (dep.startsWith('@aws-cdk') || dep.startsWith('aws-cdk')) {
          if (fs.existsSync((`${pkgDir}/node_modules/${dep}`))) {
            if (fs.existsSync(`${pkgDir}/../${dep}`)) {
              throw new Error(`${chalk.red('Version Error')}: It seems like ${dep} was not ` +
                'properly installed for Mira as a peerDependency.  Try re-running ' +
                'with the --ignore-version-errors flag after deleting ' +
                'node_modules and reinstalling.  If you' +
                ' encounter errors please log an issue ticket so the team' +
                ' can update the Mira package.json file.  See ' +
                'https://github.com/nearform/mira/issues/new')
            }
            const depPkg = JSON.parse(fs.readFileSync(`${pkgDir}/node_modules/${dep}/package.json`, 'utf8'))
            if (depPkg.version !== version) {
              throw new Error(`${chalk.red('Version Error')}: the ` +
                `Mira dependency ${dep} has a version of ${depPkg.version} but` +
                ` this mismatches the expected Mira CDK version of ${version}.` +
                '  Try re-running with the --ignore-version-errors flag and' +
                ' deleting node_modules, then reinstalling.  If' +
                ' you encounter errors please log an issue ticket so the team.' +
                '  See https://github.com/nearform/mira/issues/new')
            }
          }
        }
      }
    }

    /**
     * Checks that the file within node_modules matches what is expected for
     * the dependency provided and the version.  If any of these checks fails,
     * an error is thrown.
     */
    checkNodeModuleDependency (dep: string, version: string): void {
      const pkgDir = FileHelpers.getPackageDirectory()
      if (!fs.existsSync(`${pkgDir}/node_modules/${dep}/package.json`)) {
        throw new Error(`${chalk.red('Version Error')}: Package ${dep} not found in node_modules` +
          ', did you forget to install?')
      }
      const depPkg = JSON.parse(fs
        .readFileSync(`${pkgDir}/node_modules/${dep}/package.json`, 'utf8'))
      if (depPkg.version !== version) {
        throw new Error(`${chalk.red('Version Error')}: The ` +
          `version for ${dep} of ${depPkg.version} did not match the expected` +
          ` value  of ${version}.  Try deleting node_modules and reinstalling.`)
      }
    }

    /**
     * Gets the CDK version within this local version of Mira.  If there are
     * any version range operators used, throws an error.
     */
    getLocalMiraCDKVersion (): string|boolean {
      const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`, 'utf8'))
      try {
        const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies)
        const cdkVersion = deps['aws-cdk']
        this.checkDependency(cdkVersion)
        for (const dep in deps) {
          if (dep.startsWith('@aws-cdk')) {
            const cdkDepVersion = deps[dep]
            this.checkDependency(cdkVersion, dep, cdkDepVersion, 'aws-cdk')
          }
        }
        this.checkLocalMiraCDKDependencies(cdkVersion, pkg)
        return cdkVersion
      } catch (e) {
        console.warn('An error occurred while reading the CDK version ' +
                'used by Mira:', chalk.grey(e))
        return false
      }
    }
}

export default new MiraVersion()
