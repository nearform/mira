'use strict'
import cp from 'child_process'
import fs from 'fs'
import path from 'path'
/**
 * ## ErrorLogger Class
 * This class is used internally by Mira to log errors to an output file.
 * The log files generated can be used to help debug deployment issues and use
 * the output file name mira-errors-yyyymmddhhss.log.
 * @packageDocumentation
 */
import format from 'dateformat'
import { promisify } from 'util'

/** @ignore - Excluded from documentation generation.  */
const unlink = promisify(fs.unlink).bind(fs)

/** @ignore - Excluded from documentation generation.  */
const readdir = promisify(fs.readdir).bind(fs)

/**
 * A Mira support class for logging errors to an output file for later debugging.
 *
 * @internal
 * @class ErrorLogger
 */
export default class ErrorLogger {
  file: string
  constructor () {
    const d = format(new Date(), 'yyyymmddhhss')
    this.file = path.join(process.cwd(), `mira-errors-${d}.log`)
  }

  /**
   * Flush messages to the output stream.
   */
  flushMessages (messages: string[]): void {
    // do not run if in AWS CodeBuild
    if (undefined === process.env.CODEBUILD_BUILD_ID) {
      const ws = fs.createWriteStream(this.file)
      messages.map((message) => {
        ws.write(message)
      })
      ws.close()
    }
  }

  /**
   * Remove older Mira Error Log files
   */
  async cleanMessages (): Promise<void> {
    const files = await readdir(process.cwd())
    const promises = files
      .filter((file) => {
        return file.match(/mira-errors-\d{12}\.log$/)
      })
      .map(async (file) => {
        return unlink(file).catch(() =>
          Promise.resolve(() => {
            // Windows fix, sometimes this will still generate a non-zero exit
            // code but will also delete the file (intended action).  Some
            // Windows users may not have installed MiniGW / WSL and this will
            // also fail.
            try { cp.execSync(`rm -f ${file}`) } catch (e) {
              // NOOP
            }
          }))
      })
    await Promise.all(promises)
  }
}
