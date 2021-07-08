import { SynthUtils } from "@aws-cdk/assert"
import { Stack, App } from "@aws-cdk/core"

import {
  MiraConfig,
  DomainConfig,
  Account,
} from "../../../../config/mira-config"

import { CustomDomain } from "./custom-domain"

describe("CustomDomain", () => {
  test("renders output correctly", () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName("CustomDomain"),
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

    const f = new CustomDomain(stack, {
      source: 'source-url',
      target: 'target-url'
    })
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot()
  })
})
