const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const chaiAsPromised = require('chai-as-promised')
const thing = require('../../lib/models/thing')
const tdValid1 = require('../data/td_valid_1.json')
const tdExposed1 = require('../data/td_exposed_1.json')
const { connect } = require('../../lib/db')

chai.use(chaiAsPromised)

describe('Models', () => {
  before(async () => {
    const db = await connect()
    await db.collection('things').deleteMany({})
  })

  describe('Thing', () => {
    it('create thing', async () => {
      const user = 'cccebb9c-2602-48f4-9190-9fcd5834b777'
      const username = 'test.user3@gmail.com'
      const result = await thing.create(tdValid1, user, username)
      assert(result.insertedCount === 1)
      const insertedThing = result.ops[0]
      expect(insertedThing.unexposed).to.deep.equal(tdValid1)
      expect(insertedThing.exposed).to.deep.equal(tdExposed1)
      expect(insertedThing.id).to.equal('urn:dev:ops:32473-WoTLamp-1234')
      expect(insertedThing.owner).to.equal(user)
      expect(insertedThing.ownerUsername).to.equal(username)
      expect(insertedThing.types).to.equal(undefined)
      expect(insertedThing.title).to.equal('MyLampThing')
      expect(insertedThing.source).to.equal(undefined)
      expect(insertedThing).to.have.all.keys(
        '_id',
        'id',
        'exposed',
        'unexposed',
        'owner',
        'ownerUsername',
        'source',
        'title',
        'types'
      )
    })

    it('create thing with duplicate id', async () => {
      const user = 'cccebb9c-2602-48f4-9190-9fcd5834b777'
      const username = 'test.user3@gmail.com'
      expect(thing.create(tdValid1, user, username)).to.be.rejected
    })

    it('check if thing id exists', async () => {
      const result = await thing.existsById(tdValid1.id)
      expect(result).equal(true)
    })

    it('check if thing id not exists', async () => {
      const result = await thing.existsById('test:test')
      expect(result).equal(false)
    })

    it('remove thing by id', async () => {
      const result = await thing.deleteById(tdValid1.id)
      expect(result).equal(true)
    })

    it('remove non existing thing by id', async () => {
      const result = await thing.deleteById(tdValid1.id)
      expect(result).equal(false)
    })

    it('create thing with type and source', async () => {
      const user = 'cccebb9c-2602-48f4-9190-9fcd5834b777'
      const username = 'test.user3@gmail.com'
      const source = 'example_source_plugin'
      const result = await thing.create(
        {
          ...tdValid1,
          id: 'urn:uuid:1',
          '@type': 'iot:TestType'
        },
        user,
        username,
        { source }
      )
      assert(result.insertedCount === 1)
      const insertedThing = result.ops[0]
      expect(insertedThing.types).to.deep.equal(['iot:TestType'])
      expect(insertedThing.source).to.equal(source)
    })

    it('create thing with multiple types', async () => {
      const user = 'cccebb9c-2602-48f4-9190-9fcd5834b888'
      const username = 'test.user4@gmail.com'
      const result = await thing.create(
        {
          ...tdValid1,
          id: 'urn:uuid:2',
          '@type': ['iot:TestType1', 'iot:TestType2']
        },
        user,
        username
      )
      assert(result.insertedCount === 1)
      const insertedThing = result.ops[0]
      expect(insertedThing.types).to.deep.equal([
        'iot:TestType1',
        'iot:TestType2'
      ])
    })

    it('find by ids', async () => {
      const result = await thing.findByIds(['urn:uuid:1', 'urn:uuid:2'])
      expect(result).to.deep.equal([
        {
          owner: 'test.user3@gmail.com',
          id: 'urn:uuid:1',
          title: 'MyLampThing',
          types: ['iot:TestType']
        },
        {
          owner: 'test.user4@gmail.com',
          id: 'urn:uuid:2',
          title: 'MyLampThing',
          types: ['iot:TestType1', 'iot:TestType2']
        }
      ])
    })

    it('find by ids with limit', async () => {
      const result = await thing.findByIds(['urn:uuid:1', 'urn:uuid:2'], {
        limit: 1
      })
      expect(result).to.deep.equal([
        {
          owner: 'test.user3@gmail.com',
          id: 'urn:uuid:1',
          title: 'MyLampThing',
          types: ['iot:TestType']
        }
      ])
    })

    it('find by ids with skip', async () => {
      const result = await thing.findByIds(['urn:uuid:1', 'urn:uuid:2'], {
        skip: 1
      })
      expect(result).to.deep.equal([
        {
          owner: 'test.user4@gmail.com',
          id: 'urn:uuid:2',
          title: 'MyLampThing',
          types: ['iot:TestType1', 'iot:TestType2']
        }
      ])
    })

    it('find by ids with resolve', async () => {
      const result = await thing.findByIds(['urn:uuid:1', 'urn:uuid:2'], {
        resolve: true,
        limit: 1
      })
      // TODO:
    })

    it('find by ids with unexposed resolve', async () => {
      const result = await thing.findByIds(['urn:uuid:1', 'urn:uuid:2'], {
        resolve: true,
        limit: 1
      })
      // TODO:
    })
  })
})
