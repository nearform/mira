import { CfnOutput, Construct, NestedStack, Stack } from '@aws-cdk/core'
import { MiraConfig } from '../config/mira-config'
import { IStringParameter, StringParameter } from '@aws-cdk/aws-ssm'

interface ParsedName {
  readonly id: string
  readonly parameterName: string
}

export interface ExportOutputs {
  addOutput (name: string, value: string, shouldExport: boolean): void
}

/**
 * Utils Mira class.  Export helper methods
 */
export class MiraUtils {
  /**
   * Loads a parameter from attributes.
   */
  static loadParameter (stack: Stack, fullName: string): IStringParameter {
    const { id, parameterName } = MiraUtils.parseParameterName(stack, fullName)
    return StringParameter.fromStringParameterAttributes(stack, id, {
      parameterName
    })
  }

  /**
   * Parses a parameter given a fully qualified parameter path.
   */
  private static parseParameterName (
    stack: Stack,
    fullName: string
  ): ParsedName {
    const nameParts = fullName.split('/')
    const baseName = nameParts.length === 1 ? stack.stackName : nameParts[0]
    const name = nameParts.length === 1 ? nameParts[0] : nameParts[1]

    const id = `${baseName}${name}Parameter`
    const parameterName = `/${MiraConfig.calculateSharedResourceName(
      'param'
    )}/${baseName}/${name}`

    return { id, parameterName }
  }

  /**
   * Creates a parameter that will reside on the stack in Cfn.
   */
  static createParameter (
    stack: Stack,
    fullName: string,
    description: string,
    value: string
  ): StringParameter {
    const { id, parameterName } = MiraUtils.parseParameterName(stack, fullName)

    return new StringParameter(stack, id, {
      description,
      parameterName,
      stringValue: value
    })
  }

  /**
   * Adds an output to the stack.
   * @param name
   * @param value
   * @param shouldExport
   */
  static addOutput (
    stack: Stack,
    name: string,
    value: string,
    shouldExport = true
  ): void {
    const exportName = name
    new CfnOutput((stack as unknown) as Construct, name, {
      value: value
    })

    if (
      shouldExport &&
      stack instanceof NestedStack &&
      stack.nestedStackParent
    ) {
      new CfnOutput(stack.nestedStackParent, exportName, {
        value: value
      })
    }
  }
}
