/* eslint-env mocha */

const chai = require('chai')
const chaiHttp = require('chai-http')
const tdValidWithTypes = require('../data/td_valid_with_types.json')
const accessTokenUser1 = require('../data/access_token_1.json')
const { app } = require('../..')
const { prisma } = require('../../lib/utils/prisma')
const queries = require('../../lib/queries')

chai.use(chaiHttp)
chai.should()

describe('API', () => {
  describe('Affordances', () => {
    describe('Listing Empty', () => {
      before(async () => {
        return prisma.thing.deleteMany({})
      })

      it('get empty', done => {
        chai
          .request(app)
          .get('/registry/affordances')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.be.eql([])

            done()
          })
      })
    })

    describe('Listing', () => {
      before(async () => {
        await prisma.thing.deleteMany({})
        return queries.createThing({
          owner: '5ccc7bff-7e60-4604-ac1e-c1b7b0b5951d',
          description: tdValidWithTypes,
          enableProxy: false
        })
      })

      it('get', done => {
        chai
          .request(app)
          .get('/registry/affordances')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.to.have.lengthOf(3)
            res.body.should.to.have.deep.members([
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/properties/status',
                type: 'property',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'status',
                types: ['iot:type_property_1', 'iot:type_property_2']
              },
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/actions/toggle',
                type: 'action',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'toggle',
                types: ['iot:type_action_1', 'iot:type_action_2']
              },
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/events/overheating',
                type: 'event',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'overheating',
                types: ['iot:type_event_1', 'iot:type_event_2']
              }
            ])

            done()
          })
      })

      it('filter by thingId', done => {
        chai
          .request(app)
          .get('/registry/affordances?thingId=urn:dev:ops:32473-WoTLamp-1234')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.to.have.lengthOf(3)

            done()
          })
      })

      it('filter one affordanceType', done => {
        chai
          .request(app)
          .get('/registry/affordances?affordanceType=property')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.to.have.lengthOf(1)
            res.body.should.to.have.deep.members([
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/properties/status',
                type: 'property',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'status',
                types: ['iot:type_property_1', 'iot:type_property_2']
              }
            ])

            done()
          })
      })

      it('filter by multiple affordanceType', done => {
        chai
          .request(app)
          .get(
            '/registry/affordances?affordanceType=property&affordanceType=action'
          )
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.to.have.lengthOf(2)
            res.body.should.to.have.deep.members([
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/properties/status',
                type: 'property',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'status',
                types: ['iot:type_property_1', 'iot:type_property_2']
              },
              {
                id: 'urn:dev:ops:32473-WoTLamp-1234/actions/toggle',
                type: 'action',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234',
                name: 'toggle',
                types: ['iot:type_action_1', 'iot:type_action_2']
              }
            ])

            done()
          })
      })
    })
  })
})
