import { Context } from 'aws-lambda'

import * as https from 'https'
import * as url from 'url'

exports.SUCCESS = 'SUCCESS'
exports.FAILED = 'FAILED'

export interface LambdaEvent {
  StackId: string
  RequestId: string
  LogicalResourceId: string
  ResponseURL: string
  RequestType: string
  ResourceProperties: {
    Source: string
    Target: string
  }
  OldResourceProperties: {
    Source: string
    Target: string
  }
}

export interface ResponseData {
  Arn?: string
}

export async function send (event: LambdaEvent, context: Context, responseStatus: string, responseData: ResponseData, physicalResourceId?: string, noEcho?: boolean): Promise<string> {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: noEcho || false,
    Data: responseData
  })

  console.log(responseBody)

  console.log('Response body:\n', responseBody)

  console.log(event.ResponseURL)
  const parsedUrl = new url.URL(event.ResponseURL)
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: `${parsedUrl.pathname}?${parsedUrl.searchParams}`,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  }
  console.log(options)
  return new Promise((resolve, reject) => {
    const request = https.request(options, function (response) {
      console.log('Status code: ' + response.statusCode)
      console.log('Status message: ' + response.statusMessage)
      resolve()
    })

    request.on('error', function (error: Error) {
      console.log('send(..) failed executing https.request(..): ' + error)
      reject(error)
    })

    request.write(responseBody)
    request.end()
  })
}
