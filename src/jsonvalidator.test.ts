import '@aws-cdk/assert/jest'
import * as JsonValidation from './jsonvalidator'
import * as fs from 'fs'
import * as os from 'os'

describe.skip('jsonvalidator broken test', () => {
  beforeAll((): void => {
    const jsonfile = JSON.parse(fs.readFileSync('cdk.sample.json', 'utf-8'))
    delete jsonfile.context.Developer.env
    fs.writeFileSync(os.tmpdir() + '/cdk.broken.json', JSON.stringify(jsonfile))
  })

  afterAll(() => {
    fs.unlinkSync(os.tmpdir() + '/cdk.broken.json')
  })

  test('Json validator: Non existent file load throws an error', () => {
    expect(() => {
      JsonValidation.readCdkJson('bogusfile')
    }).toThrowError()
  })

  test('Json validator: Can load file', () => {
    expect(() => {
      JsonValidation.readCdkJson('cdk.sample.json')
    }).not.toThrowError()
  })

  test('Json validator: Sample file passes', () => {
    expect(() => {
      JsonValidation.validateCdkJson(JsonValidation.getCdkSchema(), 'cdk.sample.json')
    }).not.toThrowError()
  })

  test('Json validator: Broken sample file throws error', () => {
    expect(() => {
      JsonValidation.validateCdkJson(JsonValidation.getCdkSchema(), 'cdk.broken.json')
    }).toThrowError()
  })
})
