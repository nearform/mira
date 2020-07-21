import glob from 'glob'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import crypto from 'crypto'
import tmp from 'tmp'

interface FileData {
  [key: string]: string
}
const read = promisify(fs.readFile).bind(fs)
const stat = promisify(fs.stat).bind(fs)
const write = promisify(fs.writeFile).bind(fs)

export default class ChangeDetector {
  rootPath: string
  snapshotFile = '.mira.snapshot'
  defaultSnapshotFilePath: string

  constructor (rootPath: string) {
    this.rootPath = rootPath
    this.defaultSnapshotFilePath = path.join(this.rootPath, this.snapshotFile)
  }

  public async filesChanged (): Promise<boolean> {
    return this.run()
  }

  public async run (): Promise<boolean> {
    const snapshot = await this.getSnapshot()

    if (!snapshot) {
      await this.takeSnapshot(this.defaultSnapshotFilePath)
      return true
    }
    // check against snapshot
    const tempSnapshotFile = tmp.fileSync()
    await this.takeSnapshot(tempSnapshotFile.name)
    const buf = await read(this.defaultSnapshotFilePath)
    const tmpBuf = await read(tempSnapshotFile.name)
    if (buf.equals(tmpBuf)) {
      // no changes
      return false
    }
    return true
  }

  public async takeSnapshot (outputFile: string): Promise<null> {
    return new Promise((resolve, reject) => {
      glob(`${this.rootPath}/**`, {
        ignore: ['**/node_modules/**', '**/cdk.out/**']
      }, async (err, res) => {
        if (err) {
          return reject(err)
        }
        const output: string[] = []
        const promises = res.map(async (file) => {
          const relative = path.relative(this.rootPath, file)
          if (relative) { // skip empty files
            const fileData = await stat(file)
            const hash = this.getHash(`${fileData.size}${fileData.mtime}`)
            output.push(`${relative}||${hash}`)
          }
        })
        await Promise.all(promises)
        await write(outputFile, output.sort().join('\n'))
        return resolve(null)
      })
    })
  }

  public async getSnapshot (): Promise<FileData|null> {
    try {
      const res = await read(path.join(this.rootPath, this.snapshotFile))
      const output: { [key: string]: string } = {}
      res
        .toString()
        .split('\n')
        .forEach((line) => {
          const [file, data] = line.split('||')
          output[file] = data
        })
      return output
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    }
  }

  public getHash (value: string): string {
    return crypto.createHash('md5').update(value).digest('hex')
  }
}
