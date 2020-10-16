export default class FileHelpers {
  /**
     * Gets the most relevant application directory.  This is defined by taking
     * the currently executing file folder, and checking or moving up until the
     * directory is no longer inside a node_modules folder.
     * @param {String} path (Optional) If provided, attempts to lookup from the
     * from directory.
     * @return {String} The most relevant application directory.
     */
  static getApplicationDirectory (path = ''): string {
    if (!path.length) {
      path = process.cwd()
    }
    path = require('path').resolve(path)
    if (!require('fs').statSync(path).isDirectory()) {
      path = require('path').dirname(path)
    }
    path = FileHelpers.normalize(path)
    while (path.includes('node_modules')) {
      path = path.split('/').slice(0, -1).join('/')
    }
    return FileHelpers.normalize(path)
  }

  /**
     * Heuristic for guessing main directory.  This includes resolving the
     * following use cases:
     *   1) ./node_modules/.bin scripts
     *   2) ./node_modules/PACKAGE_NAME/file scripts
     *   3) ./SUBDIR/file calls
     *
     * The first non-node_modules folder with a package.json in it is used.
     */
  static getMainDirectory (): string|boolean {
    if (FileHelpers.getPackageDirectory() === false) {
      return false
    }
    return FileHelpers.normalize((FileHelpers.getPackageDirectory(
      FileHelpers.getApplicationDirectory()) as string))
  }

  /**
     * Gets the directory of a package.
     * @param {String} path The path from which to look for the package directory.
     * @returns {String} The directory containing the package.json file.
     */
  static getPackageDirectory (path?: string): string|boolean {
    if (FileHelpers.getPackageFile(path) === false) {
      return false
    }
    return FileHelpers.normalize((FileHelpers.getPackageFile(path) as string).split('/').slice(0, -1).join('/'))
  }

  /**
     * Gets the package.json given a file path.  If not found in the filepath
     * directory, moves up a directory.
     * @param {String} file The file path to search from.
     * @return {Boolean|String} False if no file is found.
     */
  static getPackageFile (path?: string): string|boolean {
    if (!path || path === undefined) {
      path = process.cwd()
    }

    path = FileHelpers.normalize(path) // Why would this fail?
    if (!require('fs').existsSync(path)) {
      return false
    }

    try {
      path = FileHelpers.normalize(path) // Why would this fail?
    } catch (e) {
      try {
        if (require('fs').existsSync(process.cwd() + '/' + path)) {
          path = FileHelpers.normalize(process.cwd() + '/' + path)
        }
      } catch (e) {
        return false
      }
    }

    if (!require('fs').statSync(path).isDirectory()) {
      path = require('path').dirname(path)
    }
    if (path === undefined) {
      return false
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
     * Normalize a pathname.
     */
  static normalize (path: string): string {
    // TODO: Enable the mustExist variable.
    path = require('path').resolve(path).replace(/\\/g, '/')
    if (process.platform === 'win32') {
      return path.toLowerCase()
    } else {
      return path
    }
  }
}
