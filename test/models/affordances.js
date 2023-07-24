const assert = require('assert')
const chai = require('chai')
const expect = require('chai').expect
const chaiAsPromised = require('chai-as-promised')
const affordances = require('../../lib/models/affordances')
const tdValid = require('../data/td_valid.json')
const { connect } = require('../../lib/db')

chai.use(chaiAsPromised)

describe('Models', () => {
  describe('Affordances', () => {
    const user = 'cccebb9c-2602-48f4-9190-9fcd5834b777'
    const username = 'test.user3@gmail.com'

    before(async () => {
      await connect()
      await affordances.init()
    })

    describe('Creation', () => {
      before(async () => {
        const db = await connect()
        await db.collection('affprdances').deleteMany({})
      })

      it('create thing without types', async () => {
        const result = await thing.create(tdValid, user, username)
        assert(result.insertedCount === 1)
        const insertedThing = result.ops[0]
        expect(insertedThing.description).to.deep.equal(tdValid)
        expect(insertedThing.id).to.equal('urn:dev:ops:32473-WoTLamp-1234')
        expect(insertedThing.owner).to.equal(user)
        expect(insertedThing.username).to.equal(username)
        expect(insertedThing.types).to.equal(undefined)
        expect(insertedThing.title).to.equal('MyLampThing')
        expect(insertedThing.source).to.equal(undefined)
        expect(insertedThing).to.have.all.keys(
          '_id',
          'id',
          'description',
          'owner',
          'username',
          'source',
          'title',
          'types'
        )
      })

      it('create thing with duplicate id', async () => {
        expect(thing.create(tdValid, user, username)).to.be.rejected
      })

      it('create thing with types', async () => {
        const tdValidWithTypes = {
          ...tdValid,
          id: 'urn:dev:ops:32473-WoTLamp-1234-with-types',
          '@type': ['iot:sensor_a', 'iot:sensor_b']
        }
        const result = await thing.create(tdValidWithTypes, user, username)
        assert(result.insertedCount === 1)
        const insertedThing = result.ops[0]
        expect(insertedThing.description).to.deep.equal(tdValidWithTypes)
        expect(insertedThing.id).to.equal(tdValidWithTypes.id)
        expect(insertedThing.owner).to.equal(user)
        expect(insertedThing.username).to.equal(username)
        expect(insertedThing.types).to.deep.equal([
          'iot:sensor_a',
          'iot:sensor_b'
        ])
        expect(insertedThing.title).to.equal('MyLampThing')
        expect(insertedThing.source).to.equal(undefined)
        expect(insertedThing).to.have.all.keys(
          '_id',
          'id',
          'description',
          'owner',
          'username',
          'source',
          'title',
          'types'
        )
      })

      it('create thing with source', async () => {
        const tdValidWithSource = {
          ...tdValid,
          id: 'urn:dev:ops:32473-WoTLamp-1234-with-source'
        }
        const result = await thing.create(tdValidWithSource, user, username, {
          source: 'source-name'
        })
        assert(result.insertedCount === 1)
        const insertedThing = result.ops[0]
        expect(insertedThing.description).to.deep.equal(tdValidWithSource)
        expect(insertedThing.id).to.equal(tdValidWithSource.id)
        expect(insertedThing.owner).to.equal(user)
        expect(insertedThing.username).to.equal(username)
        expect(insertedThing.types).to.equal(undefined)
        expect(insertedThing.title).to.equal('MyLampThing')
        expect(insertedThing.source).to.equal('source-name')
        expect(insertedThing).to.have.all.keys(
          '_id',
          'id',
          'description',
          'owner',
          'username',
          'source',
          'title',
          'types'
        )
      })
    })

    describe('Get', () => {
      before(async () => {
        const db = await connect()
        await db.collection('things').deleteMany({})
        await thing.create(tdValid, user, username)
      })

      it('check if thing id exists', async () => {
        const result = await thing.existsById(tdValid.id)
        expect(result).equal(true)
      })

      it('check if thing id not exists', async () => {
        const result = await thing.existsById('test:test')
        expect(result).equal(false)
      })

      it('get thing', async () => {
        const foundThing = await thing.findOne(tdValid.id)
        expect(foundThing.description).to.deep.equal(tdValid)
        expect(foundThing.id).to.equal(tdValid.id)
        expect(foundThing.owner).to.equal(user)
        expect(foundThing.username).to.equal(username)
        expect(foundThing.types).to.equal(null)
        expect(foundThing.title).to.equal('MyLampThing')
        expect(foundThing.source).to.equal(null)
        expect(foundThing).to.have.all.keys(
          'id',
          'description',
          'owner',
          'username',
          'source',
          'title',
          'types'
        )
      })

      it('get non-existing thing', async () => {
        const foundThing = await thing.findOne('uri:urn:not-existing')
        expect(foundThing).to.deep.equal(null)
      })
    })

    describe('List', () => {
      before(async () => {
        const db = await connect()
        await db.collection('things').deleteMany({})
        for (let n = 0; n < 30; n++) {
          await thing.create(
            { ...tdValid, id: tdValid.id + n },
            user,
            username
          )
        }
      })

      it('get all things', async () => {
        const things = await thing.findAll()
        expect(things.length).to.deep.equal(30)
        // TODO: deep equal
      })
    })

    describe('List Filter', () => {
      const createdIds = []

      before(async () => {
        const db = await connect()
        await db.collection('things').deleteMany({})
        for (let n = 0; n < 30; n++) {
          await thing.create(
            { ...tdValid, id: tdValid.id + n },
            user,
            username
          )
          createdIds.push(tdValid.id + n)
        }
      })

      it('get things by ids', async () => {
        const things = await thing.findByIds([
          'urn:dev:ops:32473-WoTLamp-12340',
          'urn:dev:ops:32473-WoTLamp-12341',
          'urn:dev:ops:32473-WoTLamp-12342'
        ])
        expect(things.length).to.deep.equal(3)
        expect(things[0].description).to.not.exist
      })

      it('get all things by ids', async () => {
        const things = await thing.findByIds(createdIds)
        expect(things.length).to.deep.equal(30)
        expect(things[0].description).to.not.exist
      })

      it('skip things', async () => {
        const things = await thing.findByIds(createdIds, {
          skip: 2,
          limit: 3
        })
        expect(things.length).to.deep.equal(3)
        expect(things[0].description).to.not.exist
      })

      it('resolve thing', async () => {
        const things = await thing.findByIds(createdIds, {
          resolve: true
        })
        expect(things.length).to.deep.equal(30)
        expect(things[0].description).to.exist
      })
    })

    describe('Delete', () => {
      before(async () => {
        const db = await connect()
        await db.collection('things').deleteMany({})
        await thing.create(tdValid, user, username)
      })

      it('remove thing by id', async () => {
        const result = await thing.deleteById(tdValid.id)
        expect(result).equal(true)
      })

      it('remove non existing thing by id', async () => {
        const result = await thing.deleteById('uri:urn:non-existing')
        expect(result).equal(false)
      })
    })

    describe('Update', () => {
      const modifiedThing = {
        ...tdValid,
        title: 'New Title'
      }

      before(async () => {
        const db = await connect()
        await db.collection('things').deleteMany({})
        await thing.create(tdValid, user, username)
      })

      it('Update thing title', async () => {
        const result = await thing.update(modifiedThing)
        assert(result.ok === 1)
      })

      it('Get updated thing', async () => {
        const foundThing = await thing.findOne(modifiedThing.id)
        expect(foundThing.description).to.deep.equal(modifiedThing)
        expect(foundThing.id).to.equal(modifiedThing.id)
        expect(foundThing.owner).to.equal(user)
        expect(foundThing.username).to.equal(username)
        expect(foundThing.types).to.equal(null)
        expect(foundThing.title).to.equal('New Title')
        expect(foundThing.source).to.equal(null)
        expect(foundThing).to.have.all.keys(
          'id',
          'description',
          'owner',
          'username',
          'source',
          'title',
          'types'
        )
      })
    })
  })
})
