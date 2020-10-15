import '@aws-cdk/assert/jest'
import ErrorLogger from './error-logger'
import fs from 'fs'

describe('error logger', () => {
  describe('constructor()', () => {
    test('should generate correct output file', () => {
      const logger = new ErrorLogger()
      expect(logger.file).toMatch(/mira-errors-\d{12}\.log$/)
    })
  })

  describe('flushMessages()', () => {
    beforeEach(() => {
      try {
        // fs.unlinkSync('/tmp/my-file.log')
      } catch (err) {
        // do nothing
      }
    })
    test('should not run if in codebuild', async () => {
      process.env.CODEBUILD_BUILD_ID = 'a-codebuild-id'
      const logger = new ErrorLogger()
      await logger.flushMessages([
        'message1',
        'message2'
      ])
      expect(fs.existsSync(logger.file)).toBeFalsy()
      delete process.env.CODEBUILD_BUILD_ID
    })

    test('should not run normally', async () => {
      const logger = new ErrorLogger()
      await logger.flushMessages([
        'message1',
        'message2'
      ])
      expect(fs.existsSync(logger.file)).toBeTruthy()
      fs.unlinkSync(logger.file)
    })
  })
  describe('cleanMessages()', () => {
    test('it should delete files', async () => {
      // create some files
      const files = [
        'mira-errors-123123123123.log',
        'mira-errors-123123123124.log',
        'mira-errors-123123123125.log'
      ]
      files.map((file) => {
        fs.writeFileSync(file, 'foobar')
      })
      const logger = new ErrorLogger()
      await logger.cleanMessages()
      files.map((file) => {
        expect(fs.existsSync(file)).toBeFalsy()
      })
    })
  })
})
