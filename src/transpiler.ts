import { exec } from 'child_process'
import glob from 'glob'
import path from 'path'

class Transpiler {
  filePath: string
  constructor (filePath: string) {
    this.filePath = filePath
  }

  async run (): Promise<string> {
    const res = await this.findTSConfigFile(process.cwd())
    if (res) {
      const relativePath = path.dirname(path.relative(process.cwd(), res))
      const compiledFile = await this.compile(relativePath)
      return compiledFile
    } else {
      throw new Error('Cannot find tsconfig.json file in project path.')
    }
  }

  private async compile (configPath: string): Promise<string> {
    const command = `npx tsc -p ${configPath}`
    return new Promise((resolve, reject) => {
      exec(command, {
        cwd: process.cwd()
      }, (err: Error|null) => {
        if (err) {
          return reject(err)
        }
        // change file name
        const newFilePath = this.changeExtension('js')
        return resolve(newFilePath)
      })
    })
  }

  public changeExtension (newExtension: string): string {
    return this.filePath.substring(0, this.filePath.length - 2) + newExtension
  }

  public async findTSConfigFile (start: string): Promise<string|null> {
    return new Promise((resolve, reject) => {
      glob(`${start}/**/tsconfig.json`, {
        ignore: '/**/node_modules/**'
      }, (err, matches) => {
        if (err) {
          return reject(err)
        }
        if (matches.length) {
          return resolve(matches[0])
        }
        return resolve(null)
      })
    })
  }
}

export default Transpiler
