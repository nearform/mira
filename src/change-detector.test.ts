import '@aws-cdk/assert/jest'
import path from 'path'
import ChangeDetector from './change-detector'
import fs from 'fs'

const fixturesDirectory = path.join(__dirname, '..', 'test', 'fixtures', 'change-detector')
const snapshotFile = path.join(fixturesDirectory, '.mira.snapshot')

describe('change detector', () => {
  beforeEach(() => {
    try {
      return fs.unlinkSync(snapshotFile)
    } catch (err) {
      // do nothing
    }
  })
  describe('run()', () => {
    test('should return true if first run', async () => {
      const root = fixturesDirectory
      const cd = new ChangeDetector(root)
      const res = await cd.run()
      expect(res).toBeTruthy()
      expect(fs.existsSync(snapshotFile)).toBeTruthy()
      fs.unlinkSync(snapshotFile)
    })
    test('should return false on second run', async () => {
      const root = fixturesDirectory
      const cd = new ChangeDetector(root)
      await cd.run()
      const res = await cd.run()
      expect(res).toBeFalsy()
      expect(fs.existsSync(snapshotFile)).toBeTruthy()
      fs.unlinkSync(snapshotFile)
    })
    test('should return false if a file changes', async () => {
      const root = fixturesDirectory
      const cd = new ChangeDetector(root)
      await cd.run()
      // change foo file
      fs.writeFileSync(path.join(fixturesDirectory, 'foo.txt'), 'f00')
      const res = await cd.run()
      expect(res).toBeTruthy()
      expect(fs.existsSync(snapshotFile)).toBeTruthy()
      fs.unlinkSync(snapshotFile)
      fs.writeFileSync(path.join(fixturesDirectory, 'foo.txt'), 'foo')
    })
  })

  describe('getSnapshot()', () => {
    test('should return null if snapshot is not found', async () => {
      const cd = new ChangeDetector(fixturesDirectory)
      const res = await cd.getSnapshot()
      expect(res).toBe(null)
    })

    test('should return file  content if snapshot is found', async () => {
      const data = [
        'fileA||apoifhaphfaohas',
        'fileB||sdohsodhsodhsd',
        'path/to/fileC||fileCData'
      ]
      fs.writeFileSync(snapshotFile, data.join('\n'))
      const cd = new ChangeDetector(fixturesDirectory)
      const res = await cd.getSnapshot()
      fs.unlinkSync(snapshotFile)
      expect(res).not.toBeNull()
      if (res) {
        expect(Object.keys(res).length).toBe(data.length)
        expect(res.fileA).toBe('apoifhaphfaohas')
        expect(res.fileB).toBe('sdohsodhsodhsd')
        expect(res['path/to/fileC']).toBe('fileCData')
      } else {
        throw new Error('Error getting snapshot')
      }
    })
  })
  describe('takeSnapshot()', () => {
    test('should return null after creating snapshot', async () => {
      const cd = new ChangeDetector(fixturesDirectory)
      const res = await cd.takeSnapshot(snapshotFile)
      expect(res).toBe(null)
      expect(fs.existsSync(snapshotFile)).toBeTruthy()
      fs.unlinkSync(snapshotFile)
    })
  })
})
