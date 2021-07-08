import { SynthUtils } from "@aws-cdk/assert"
import { Stack, App } from "@aws-cdk/core"

import {
  MiraConfig,
  DomainConfig,
  Account,
} from "../../../../config/mira-config"

import { CustomCertificate } from "./custom-certificate"

describe("CustomCertificate", () => {
  test("renders output correctly", () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName("CustomCertificate"),
      {}
    )
    MiraConfig.getEnvironment = (envName: string): Account => {
      if (envName === 'domain') {
        return {
          name: "domain",
          profile: "domain",
          env: { account: "domain", region: "eu-west-1" },
        }
      }

      return {
        name: "account1",
        profile: "account1",
        env: { account: "account1", region: "eu-west-1" },
      }
    }

    MiraConfig.getDomainConfig = (): DomainConfig => ({
      hostedZoneId: 'Z123456789',
      accounts: [
        'account1',
        'domain'
      ],
    })

    const f = new CustomCertificate(stack, {
      domain: 'test.example.com'
    })
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
})
