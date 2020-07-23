import { getBaseStackName, getBaseStackNameFromParams, getDeployProjectRoleName } from './utils'

describe('getBaseStackName', () => {
  it('getBaseStackName should return right config base stack name based on config file', async () => {
    expect(await getBaseStackName()).toBe('John-MyGreatApp')
    expect(await getBaseStackName('dev')).toBe('John-MyGreatApp-Dev')
  })
})

describe('getBaseStackNameFromParams', () => {
  it('getBaseStackNameFromParams should right config base stack based on params', async () => {
    expect(await getBaseStackNameFromParams('company', 'app')).toBe('Company-App')
    expect(await getBaseStackNameFromParams('company', 'app', 'dev')).toBe('Company-App-Dev')
  })
})

describe('getDeployProjectRoleName', () => {
  it('getDeployProjectRoleName should return project role name', async () => {
    expect(await getDeployProjectRoleName('dev')).toBe('John-MyGreatApp-DeployProjectRole-dev')
  })
})
