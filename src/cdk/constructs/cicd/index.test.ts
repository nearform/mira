import { expect, haveResource } from '@aws-cdk/assert'
import { App } from '@aws-cdk/core'
import { Cicd } from '.'

jest.mock('config')

interface Context {
  [name: string]: string | any[] | any
}
describe('CICD', () => {
  it('Creates a CICD stack with role as Caller Identity', async () => {
    const app = new App()
    const cicd = new Cicd(app, {
      callerIdentityResponse: {
        Arn: 'arn:aws:sts::123456789012:assumed-role/demo/TestAR'
      },
      environmentVariables: []
    })

    expect(cicd).to(haveResource('AWS::CodeBuild::Project'))
    expect(cicd).to(haveResource('AWS::CodePipeline::Pipeline'))
  })

  it('Creates a CICD stack with user as Caller Identity', () => {
    const app = new App()
    const cicd = new Cicd(app, {
      callerIdentityResponse: {
        Arn: 'arn:aws:iam::101259067028:user/demo'
      },
      environmentVariables: []
    })

    expect(cicd).to(haveResource('AWS::CodeBuild::Project'))
    expect(cicd).to(haveResource('AWS::CodePipeline::Pipeline'))
  })
})
