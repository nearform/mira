/**
 * IMPORTANT: do not use external packages here that are not bundled
 */

import https from 'https'

interface SendResponseOptions {
  status: string
  requestId: string
  stackId: string
  reason: string
  logicalResourceId: string
  physicalResourceId: string
  data: object
}

/**
 * See the AWS documentation for more information on what needs to be contained in the
 * response of a custom resource.
 *
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-responses.html
 */
export const sendResponse = async (
  responseUrl: string,
  options: SendResponseOptions
): Promise<void> => {
  const body = {
    Status: options.status,
    Reason: options.reason,
    PhysicalResourceId: options.physicalResourceId,
    StackId: options.stackId,
    RequestId: options.requestId,
    LogicalResourceId: options.logicalResourceId,
    Data: options.data
  }

  const responseBody = Buffer.from(JSON.stringify(body))

  return new Promise((resolve, reject) => {
    let error: Error

    const req = https.request(
      responseUrl,
      {
        method: 'PUT',
        headers: {
          'content-type': '',
          'content-length': responseBody.byteLength
        }
      },
      (res) =>
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        res.on('data', () => {})
    )

    req.once('error', (err) => (error = err))
    req.once('close', () => (error ? reject(error) : resolve()))

    req.write(responseBody)
    req.end()
  })

  // await fetch.put(options.responseUrl, responseBody, {
  //   data: responseBody,
  //   headers: { 'content-type': '', 'content-length': responseBody.length }
  // })
}
