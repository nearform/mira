import '@aws-cdk/assert/jest'
import * as JsonValidation from './jsonvalidator'

describe('jsonvalidator', () => {
  test('Json validator: Non existent file load throws an error', () => {
    expect(() => {
      JsonValidation.readJsonFile('bogusfile')
    }).toThrowError()
  })

  test('Json validator: Can load file', () => {
    expect(() => {
      JsonValidation.readJsonFile('/config/__mocks__/default.json')
    }).not.toThrowError()
  })

  test('Json validator: Sample file passes', () => {
    expect(() => {
      JsonValidation.validateFileJson(
        JsonValidation.getDefaultConfigSchema(),
        JsonValidation.readJsonFile('/config/__mocks__/default.json')
      )
    }).not.toThrowError()
  })

  test('Json validator: Broken sample file throws error', () => {
    expect(() => {
      JsonValidation.validateFileJson(
        JsonValidation.getDefaultConfigSchema(),
        JsonValidation.readJsonFile('/config/__mocks__/default.broken.json')
      )
    }).toThrowError()
  })
})
