'use strict'
import fs from 'fs'
import path from 'path'
import format from 'dateformat'
import { promisify } from 'util'

const unlink = promisify(fs.unlink).bind(fs)
const readdir = promisify(fs.readdir).bind(fs)
export default class ErrorLogger {
  file: string
  constructor () {
    const d = format(new Date(), 'yyyymmddhhss')
    this.file = path.join(process.cwd(), `mira-errors-${d}.log`)
  }

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

  async cleanMessages (): Promise<void> {
    const files = await readdir(process.cwd())
    const promises = files
      .filter((file) => {
        return file.match(/mira-errors-\d{12}\.log$/)
      })
      .map((file) => {
        return unlink(file)
      })
    await Promise.all(promises)
  }
}
