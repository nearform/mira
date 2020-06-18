import { buildSearchRegions } from './autocomplete'
describe('autocomplete', () => {
  it('buildSearchRegions should return a promise', async () => {
    const fn = buildSearchRegions()
    const res = await fn({}, 'ap')
    expect(Array.isArray(res)).toBeTruthy()
    expect(res.length > 0).toBeTruthy()
  })
})
