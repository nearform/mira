import chalk from 'chalk'
import fs from 'fs'
import FileHelpers from './filehelpers'

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
        throw new Error('Warning: The version of Mira use contains wildcard versions via \'aws-cdk\'')
      }
      if (otherVersion && version !== otherVersion) {
        throw new Error(`Warning: Mira is using mismatched CDK dependency versions (${otherDep} is ${otherVersion} and ${dep} is ${version})`)
      }
      return true
    }

    /**
     * Gets the CDK version within this local version of Mira.  If there are
     * any version range operators used, throws an error.
     */
    getLocalMiraCDKVersion (): string|boolean {
      const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`, 'utf8'))
      try {
        const cdkVersion = pkg.devDependencies['aws-cdk']
        this.checkDependency(cdkVersion)
        for (const dep in pkg.devDependencies) {
          if (dep.startsWith('@aws-cdk')) {
            const cdkDepVersion = pkg.devDependencies[dep]
            this.checkDependency(cdkVersion, dep, cdkDepVersion, 'aws-cdk')
          }
        }
        return cdkVersion
      } catch (e) {
        console.warn('An error occurred while reading the CDK version ' +
                'used by Mira:', e)
        return false
      }
    }
}

export default new MiraVersion()
