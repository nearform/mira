import Transpiler from './transpiler'
import path from 'path'

test('should throw if no tsconfig file is found', () => {
  const t = new Transpiler('sampleFile.ts')
  t.findTSConfigFile = jest.fn(async () => { return null })
  expect(t.run.bind(t)).rejects.toThrow('Cannot find tsconfig.json file in project path.')
  jest.restoreAllMocks()
})

test('should find correct tsconfig.json file', async () => {
  const t = new Transpiler('sampleFile.ts')
  const root = path.join(__dirname, '..')
  const res = await t.findTSConfigFile(root)
  expect(res).toBe(`${root}/tsconfig.json`)
})

test('should change extension to file', () => {
  const t = new Transpiler('sampleFile.ts')
  const res = t.changeExtension('foo')
  expect(res).toBe('sampleFile.foo')
})
