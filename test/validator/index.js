const assert = require('assert')
const tdValid1 = require('../data/td_valid_1.json')
const tdInvalid1 = require('../data/td_invalid_1.json')

const { validate } = require('../../lib/validator')

describe('Validation', () => {
  before(async () => {})

  it('validate thing description', async () => {
    const result = validate(tdValid1)
    assert.ok(result === true)
  })

  it('validate invalid thing description', async () => {
    const result = validate(tdInvalid1)
    assert.ok(result === false)
  })

  it('validate empty thing description', async () => {
    const result = validate({})
    assert.ok(result === false)
  })
})
