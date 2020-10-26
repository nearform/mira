import { SynthUtils } from "@aws-cdk/assert"
import { Stack, App } from "@aws-cdk/core"

import {
  MiraConfig,
  DomainConfig,
  Account,
} from "../../../../config/mira-config"

import { Route53ManagerAccessRole } from "./route53-manager-access-role"

describe("Route53ManagerAccessRole", () => {
  it("throws when hostedZoneId is not set in config", () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName("Route53Manager"),
      {}
    )

    MiraConfig.getDomainConfig = (): DomainConfig => ({
      accounts: [],
    })

    MiraConfig.getEnvironment = (): Account => ({
      name: "some-name",
      profile: "some-profile",
      env: { account: "12345", region: "eu-west-1" },
    })

    expect(() => new Route53ManagerAccessRole(stack)).toThrowError(
      '"hostedZoneId" is required in "domain" config'
    )
  })

  test("renders output correctly", () => {
    const stack = new Stack(
      new App(),
      MiraConfig.getBaseStackName("Route53ManagerAccessRole"),
      {}
    )
    MiraConfig.getDomainConfig = (): DomainConfig => ({
      hostedZoneId: 'Z123456789',
      accounts: [
        'account1',
        'domain'
      ],
    })

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
    const rm = new Route53ManagerAccessRole(stack)
    expect(SynthUtils.toCloudFormation(rm)).toMatchSnapshot()
  })
})
