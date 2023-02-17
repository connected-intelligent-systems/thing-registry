const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const chaiAsPromised = require('chai-as-promised')
const credentials = require('../../lib/models/credentials')

chai.use(chaiAsPromised)

describe('Models', () => {
  describe('Credentials', () => {
    it('create', async () => {
      const thingId = 'urn:uuid:1'
      const secret = {
        password: 'secret'
      }
      await credentials.update(thingId, secret)
      const storedSecret = await credentials.find(thingId)
      expect(storedSecret).to.deep.equal(secret)
    })

    it('update', async () => {
      const thingId = 'urn:uuid:1'
      const secret = {
        nested: {
          very: {
            deep: {
              value: true
            }
          }
        }
      }
      await credentials.update(thingId, secret)
      const storedSecret = await credentials.find(thingId)
      expect(storedSecret).to.deep.equal(secret)
    })

    it('find non existing', async () => {
      const thingId = 'urn:uuid:2'
      const storedSecret = await credentials.find(thingId)
      expect(storedSecret).to.equal(undefined)
    })

    it('deleteOne', async () => {
      const thingId = 'urn:uuid:1'
      await credentials.deleteOne(thingId)
      const storedSecret = await credentials.find(thingId)
      expect(storedSecret).to.equal(undefined)
    })
  })
})
