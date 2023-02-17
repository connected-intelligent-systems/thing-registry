const assert = require('assert')
const btoa = require('../../lib/utils/btoa')

describe('Utils', () => {
  before(async () => {})

  it('btoa', async () => {
    const result = btoa('teststring')
    assert.ok(result === 'dGVzdHN0cmluZw==')
  })

  it('btoa empty string', async () => {
    const result = btoa('')
    assert.ok(result === '')
  })
})
