const assert = require('assert')
const tdValid = require('../data/td_valid.json')
const tdInvalid = require('../data/td_invalid.json')

const { validate } = require('../../lib/validator')

describe('Validation', () => {
  before(async () => {})

  it('validate thing description', async () => {
    const result = validate(tdValid)
    assert.ok(result === true)
  })

  it('validate invalid thing description', async () => {
    const result = validate(tdInvalid)
    assert.ok(result === false)
  })

  it('validate empty thing description', async () => {
    const result = validate({})
    assert.ok(result === false)
  })
})
