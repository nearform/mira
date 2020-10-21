const assert = require('assert')
const chalk = require('chalk')
const minimist = require('minimist')
const args = minimist(process.argv.slice(2))
const cp = require('child_process')
const fs = require('fs')

const excludeList = [
    '@aws-cdk',
    'aws-cdk'
]

/**
 * Creates the bootstrap files for Mira.
 */
const createMiraBootstrap = (pkgDir) => {
    try { fs.mkdirSync(`${pkgDir}/node_modules/mira-bootstrap`) } catch (err) {
        // NOOP
    }

    fs.writeFileSync(`${pkgDir}/node_modules/mira-bootstrap/cli.js`,
        'require(\'mira/bin/cli\');', 'utf8')

    try { fs.mkdirSync(`${pkgDir}/node_modules/.bin`) } catch (err) {
        // NOOP
    }
    fs.readdirSync(__dirname + '/bin').forEach((file) => {
        fs.symlinkSync(`${__dirname}/bin/${file}`, `${pkgDir}/node_modules/.bin/${file}`)
    })
}

/**
 * Normalize a pathname.
 */
const normalize = (path) => {
    // TODO: Enable the mustExist variable.
    path = require('path').resolve(path).replace(/\\/g, '/')
    if (process.platform === 'win32') {
        return path.toLowerCase()
    } else {
        return path
    }
}

/**
 * Gets the package.json given a file path.  If not found in the filepath
 * directory, moves up a directory.
 * @param {String} file The file path to search from.
 * @return {Boolean|String} False if no file is found.
 */
const getPackageFile = (path) => {
    if (!path) {
        path = process.cwd()
    }

    if (!require('fs').existsSync(path)) {
        return false
    }

    try {
        path = normalize(path) // Why would this fail?
    } catch (e) {
        try {
            if (require('fs').existsSync(process.cwd() + '/' + path)) {
                path = normalize(process.cwd() + '/' + path)
            }
        } catch (e) {
            return false
        }
    }

    if (!require('fs').statSync(path).isDirectory()) {
        path = require('path').dirname(path)
    }
    while (!require('fs').existsSync(path + '/package.json') &&
        path.length > 1 && path.split('/').length > 1 &&
        path.split('/')[1].length > 0) {
        path = path.split('/').slice(0, -1).join('/')
    }
    if (require('fs').existsSync(path + '/package.json')) {
        return path + '/package.json'
    } else {
        return ''
    }
}

/**
 * Symlinks the `node_modules` into the target application directory's Mira dep.
 * 
 * This excludes the packages that are intended as peer dependencies within 
 * Mira itself.
 */
const symlinkDependencies = (pkgDir) => {
    try { fs.mkdirSync(`${pkgDir}/node_modules/mira/node_modules`) } catch (err) {
        // NOOP
    }
    const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'))
    const nodeModules = fs.readdirSync(`${__dirname}/../node_modules`)
    const deps = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies)).concat(nodeModules)
    // const dependencies = fs.readdirSync(__dirname + '/../node_modules/')
    console.info(chalk.cyan('Mira Local'), 'Symlinking deps')
    deps.forEach((dep) => {
        // HACK: Using dep.split is basically like a wildcard, but this usage is unclear.
        if (excludeList.includes(dep.split(/\//g).shift()) && fs.existsSync(`${pkgDir}/node_modules/${dep}`)) {
            if (args['verbose'] !== undefined) {
                console.info(chalk.grey('Skipping dependency'), dep)
            }
            return
        }
        if (args['verbose'] !== undefined) {
            console.info(chalk.magenta('Symlinking dependency'), dep)
        }
        try {
            fs.symlinkSync(`${__dirname}/../node_modules/${dep}`,
                `${pkgDir}/node_modules/mira/node_modules/${dep}`)
        } catch(e) {
            // console.info('An error occurred while symlinking.', e)
        }
        try {
            fs.symlinkSync(`${__dirname}/../node_modules/${dep}`,
                `${pkgDir}/node_modules/${dep}`)
        } catch(e) {
            // NOOP
        }
    })
    console.info(chalk.cyan('Mira Local'), chalk.green('Done'), 'symlinking deps')
}

/**
 * Symlinks Mira into the the application directory.
 */
const symlinkMira = (pkgDir) => {
    try { fs.mkdirSync(`${pkgDir}/node_modules/mira`) } catch (err) {
        // NOOP
    }
    fs.symlinkSync(__dirname + '/../dist/', `${pkgDir}/node_modules/mira/dist`)
    fs.symlinkSync(__dirname + '/../bin/', `${pkgDir}/node_modules/mira/bin`)
    fs.symlinkSync(__dirname + '/../package.json', `${pkgDir}/node_modules/mira/package.json`)
}

if (getPackageFile(args._[0])) {
    const pkgPath = getPackageFile(args._[0])
    const pkgDir = pkgPath.split(/\//g).slice(0, -1).join('/')
    const pkgObj = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    assert(pkgObj.name, 'Looks like the relevant package object found in the ' +
        'path you specified does not define a name field.')
    if (!fs.existsSync(`${pkgDir}/node_modules`)) {
        console.warn(`Looks like you have not installed the module ${pkgObj.name}:\n` +
            `Path: ${pkgDir}`)
    }
    if (fs.existsSync(`${pkgDir}/node_modules/mira`) &&
        !fs.statSync(`${pkgDir}/node_modules/mira`).isSymbolicLink()) {
        console.info(`Looks like Mira has already been installed in ${pkgObj.name}`)
        console.info(`Backing up old mira dependency to ${pkgDir}/mira.old`)
        if (fs.existsSync(`${pkgDir}/mira.old`)) {
            console.warn('mira.old folder already exists, deleting.')
            cp.execSync(`rm -rf ${pkgDir}/mira.old`, {
                stdio: 'ignore'
            })
        }
        fs.renameSync(`${pkgDir}/node_modules/mira`, `${pkgDir}/mira.old`)
    }
    try { symlinkMira(pkgDir) } catch (e) {
        // NOOP
    }
    try { symlinkDependencies(pkgDir) } catch (e) {
        // NOOP
    }

    try { createMiraBootstrap(pkgDir) } catch (e) {
        // NOOP
    }
}