/* eslint-env mocha */

const chai = require('chai')
const chaiHttp = require('chai-http')
const tdValid1 = require('../data/td_valid_1.json')
const accessTokenUser1 = require('../data/access_token_1.json')
const accessTokenUser2 = require('../data/access_token_2.json')
const { app } = require('../..')
const { prisma } = require('../../lib/utils/prisma')
const queries = require('../../lib/queries')

chai.use(chaiHttp)
chai.should()

describe('API', () => {
  describe('Permissions', () => {
    describe('Listing Empty', () => {
      before(async () => {
        await prisma.thing.deleteMany({})
        await prisma.permission.deleteMany({})
      })

      it('get empty', done => {
        chai
          .request(app)
          .get('/registry/permissions')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((_, res) => {
            res.should.have.status(200)
            res.body.should.be.eql([])
            done()
          })
      })
    })

    describe('Listing', () => {
        let createdPermissionId;

        before(async () => {
          await prisma.thing.deleteMany({})
          await prisma.permission.deleteMany({})
          await queries.createThing({
            owner: '5ccc7bff-7e60-4604-ac1e-c1b7b0b5951d',
            description: tdValid1,
            enableProxy: false
          })
         const createPermission = await prisma.permission.create({
            data: {
                entityId: "unique-user-id",
                entityType: 'user',
                scope: 'read',
                thingId: 'urn:dev:ops:32473-WoTLamp-1234'
            }
          })
          createdPermissionId = createPermission.id
        })
  
        it('get created permissions', done => {
          chai
            .request(app)
            .get('/registry/permissions')
            .set('authorization', `Bearer ${accessTokenUser1}`)
            .end((_, res) => {
              res.should.have.status(200)
              res.body.should.to.have.lengthOf(1)
              res.body.should.to.have.deep.members([
                {
                    "entityId": "unique-user-id",
                    "entityType": "user",
                    "id": res.body[0].id,
                    "scope": "read",
                    "thingId": "urn:dev:ops:32473-WoTLamp-1234"
                  }
              ])
              done()
            })
        })

        it('get permission for user 2', done => {
            chai
              .request(app)
              .get('/registry/permissions')
              .set('authorization', `Bearer ${accessTokenUser2}`)
              .end((_, res) => {
                res.should.have.status(200)
                res.body.should.be.eql([])
                done()
              })
          })

          it('delete permission with user 2', done => {
            chai
              .request(app)
              .delete(`/registry/permissions/${createdPermissionId}`)
              .set('authorization', `Bearer ${accessTokenUser2}`)
              .end((_, res) => {
                res.should.have.status(404)
                done()
              })
          })

          it('delete permission with user 1', done => {
            chai
              .request(app)
              .delete(`/registry/permissions/${createdPermissionId}`)
              .set('authorization', `Bearer ${accessTokenUser1}`)
              .end((_, res) => {
                res.should.have.status(200)
                done()
              })
          })

          it('delete non-existing permission', done => {
            chai
              .request(app)
              .delete(`/registry/permissions/${createdPermissionId}`)
              .set('authorization', `Bearer ${accessTokenUser1}`)
              .end((_, res) => {
                res.should.have.status(404)
                done()
              })
          })
      })
  })
})
