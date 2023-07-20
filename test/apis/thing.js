const chai = require('chai')
const chaiHttp = require('chai-http')
const tdValid1 = require('../data/td_valid_1.json')
const accessTokenUser1 = require('../data/access_token_1.json')
const app = require('../..')
const { prisma } = require('../../lib/utils/prisma')
const queries = require('../../lib/queries')

chai.use(chaiHttp)
chai.should()

describe('API', () => {
  describe('Things', () => {

    describe('Listing Empty', () => {
      before(async () => {
        return prisma.thing.deleteMany({})
      })

      it('get empty things list', done => {
        chai
          .request(app)
          .get('/registry/things')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((err, res) => {
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
          owner: "5ccc7bff-7e60-4604-ac1e-c1b7b0b5951d",
          description: tdValid1,
          enableProxy: false
        })
      })

      it('get things list', done => {
        chai
          .request(app)
          .get('/registry/things')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.to.have.lengthOf(1)
            res.body[0].should.have.property('title').equal(tdValid1.title);
            res.body[0].should.have.property('createdAt')
            res.body[0].should.have.property('updatedAt')
            res.body[0].should.have.property('href')
            res.body[0].should.have.property('id').equal(tdValid1.id);
            res.body[0].should.have.property('types').to.have.lengthOf(0)
            done()
          })
      })
    })

    describe('Creation', () => {
      before(async () => {
        await prisma.thing.deleteMany({})
      })

      it('create valid thing', done => {
        chai
          .request(app)
          .post('/registry/things')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .set('content-type', 'application/json')
          .send(tdValid1)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.be.eql({
              id: 'urn:dev:ops:32473-WoTLamp-1234'
            })
            done()
          })
      })

      it('get thing', done => {
        chai
          .request(app)
          .get('/registry/things/urn:dev:ops:32473-WoTLamp-1234')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.be.eql(tdValid1)
            done()
          })
      })

      it('create with same id again', done => {
        chai
          .request(app)
          .post('/registry/things')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .set('content-type', 'application/json')
          .send(tdValid1)
          .end((err, res) => {
            res.should.have.status(409)
            done()
          })
      })
    })

    describe('Deletion', () => {
      before(async () => {
        await prisma.thing.deleteMany({})
        return queries.createThing({
          owner: "5ccc7bff-7e60-4604-ac1e-c1b7b0b5951d",
          description: tdValid1,
          enableProxy: false
        })
      })

      it('delete existing thing', done => {
        chai
          .request(app)
          .delete('/registry/things/urn:dev:ops:32473-WoTLamp-1234')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((err, res) => {
            res.should.have.status(200)
            done()
          })
      })

      it('delete non existing thing', done => {
        chai
          .request(app)
          .delete('/registry/things/urn:dev:ops:32473-WoTLamp-1234')
          .set('authorization', `Bearer ${accessTokenUser1}`)
          .end((err, res) => {
            res.should.have.status(404)
            done()
          })
      })



    })
  })
})
