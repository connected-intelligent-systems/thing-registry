const chai = require('chai')
const { expect } = chai
const {
  create,
  remove,
  find,
  findOne,
  findOneOpenApi,
  update,
  assignCustomer
} = require('../../lib/services/thing')

const tdValid = require('../data/td_valid.json')
const tdInvalid = require('../data/td_invalid.json')
const { createDataset, removeDataset } = require('../../lib/utils/fuseki')
const { prisma } = require('../../lib/db')
const {
  ThingAlreadyExists,
  InvalidDescription,
  ThingNotFound
} = require('../../lib/utils/http_errors')

const datasets = [
  'tenant-id',
  'tenant-id-customer-id',
  'tenant-id-2',
  'tenant-id-2-customer-id'
]

describe('Thing Service', () => {
  describe('create', () => {
    before(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await createDataset(dataset)
      }
    })

    after(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await removeDataset(dataset)
      }
    })

    it('should create a new thing', async () => {
      await create(
        {
          ...tdValid,
          id: 'urn:dev:ops:test:001'
        },
        'tenant-id',
        'customer-id'
      )
    })

    it('should throw ThingAlreadyExists error if a thing with the same ID already exists', async () => {
      try {
        await create(
          {
            ...tdValid,
            id: 'urn:dev:ops:test:001'
          },
          'tenant-id',
          'customer-id'
        )
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingAlreadyExists)
      }
    })

    it('should throw ThingAlreadyExists error if different customer ID is provided and a thing with the same ID already exists', async () => {
      try {
        await create(
          {
            ...tdValid,
            id: 'urn:dev:ops:test:001'
          },
          'tenant-id',
          'customer-id-2'
        )
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingAlreadyExists)
      }
    })

    it('should throw ThingAlreadyExists error if no customer ID is provided and a thing with the same ID already exists', async () => {
      try {
        await create(
          {
            ...tdValid,
            id: 'urn:dev:ops:test:001'
          },
          'tenant-id'
        )
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingAlreadyExists)
      }
    })

    it('should throw InvalidDescription error if the description is invalid and validation is not skipped', async () => {
      try {
        await create(
          {
            ...tdInvalid,
            id: 'urn:dev:ops:test:002'
          },
          'tenant-id',
          'customer-id'
        )
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(InvalidDescription)
      }
    })
  })

  describe('remove', () => {
    before(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await createDataset(dataset)
      }
    })

    after(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await removeDataset(dataset)
      }
    })

    beforeEach(async () => {
      await create(
        {
          ...tdValid,
          id: 'urn:dev:ops:test:001'
        },
        'tenant-id',
        'customer-id'
      )
    })

    afterEach(async () => {
      await prisma.thing.deleteMany({})
    })

    it('should remove a thing from the registry', async () => {
      await remove('urn:dev:ops:test:001', 'tenant-id', 'customer-id')
    })

    it('should throw ThingNotFound error if the thing is not found', async () => {
      try {
        await remove('urn:dev:ops:test:002', 'tenant-id', 'customer-id')
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingNotFound)
      }
    })

    it('should throw ThingNotFound error if the thing is not found for the specified tenant and customer', async () => {
      try {
        await remove('urn:dev:ops:test:001', 'tenant-id', 'customer-id-2')
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingNotFound)
      }
    })

    it('should not throw ThingNotFound error if no customer id is provided', async () => {
      await remove('urn:dev:ops:test:001', 'tenant-id')
    })

    it('should throw ThingNotFound error if the thing is not found in the specified tenant', async () => {
      try {
        await remove('urn:dev:ops:test:001', 'tenant-id-2', 'customer-id')
        throw new Error('This should not be reached')
      } catch (error) {
        expect(error).to.be.instanceOf(ThingNotFound)
      }
    })
  })

  describe('find', () => {
    beforeEach(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await createDataset(dataset)
      }
      for (let i = 0; i < 20; i++) {
        await create(
          {
            ...tdValid,
            id: `urn:dev:ops:test:${i}`,
            '@type': [`class_${i}`, 'class_fix']
          },
          'tenant-id',
          'customer-id'
        )
      }
    })

    afterEach(async () => {
      await prisma.thing.deleteMany({})
      for (const dataset of datasets) {
        await removeDataset(dataset)
      }
    })

    it('should find things based on pagination page', async () => {
      const resultPage1 = await find('tenant-id', 'customer-id', {
        page: 1,
        page_size: 10
      })
      expect(resultPage1.page).to.equal(1)
      expect(resultPage1.pageSize).to.equal(10)
      expect(resultPage1.totalCount).to.equal(20)
      expect(resultPage1.totalPages).to.equal(2)
      expect(resultPage1.things).to.have.lengthOf(10)
      for (let i = 0; i < 10; i++) {
        expect(resultPage1.things[i].id).to.equal(`urn:dev:ops:test:${i}`)
        expect(resultPage1.things[i].types).to.have.all.members([
          `class_${i}`,
          'class_fix'
        ])
        expect(resultPage1.things[i].title).to.equal('MyLampThing')
        expect(resultPage1.things[i])
          .to.have.property('createdAt')
          .to.be.a('Date')
        expect(resultPage1.things[i])
          .to.have.property('updatedAt')
          .to.be.a('Date')
      }

      const resultPage2 = await find('tenant-id', 'customer-id', {
        page: 2,
        page_size: 10
      })
      expect(resultPage2.page).to.equal(2)
      expect(resultPage2.pageSize).to.equal(10)
      expect(resultPage2.totalCount).to.equal(20)
      expect(resultPage2.totalPages).to.equal(2)
      expect(resultPage2.things).to.have.lengthOf(10)
      for (let i = 10; i < 20; i++) {
        expect(resultPage2.things[i - 10].id).to.equal(`urn:dev:ops:test:${i}`)
        expect(resultPage2.things[i - 10].types).to.have.all.members([
          `class_${i}`,
          'class_fix'
        ])
        expect(resultPage2.things[i - 10].title).to.equal('MyLampThing')
        expect(resultPage2.things[i - 10])
          .to.have.property('createdAt')
          .to.be.a('Date')
        expect(resultPage2.things[i - 10])
          .to.have.property('updatedAt')
          .to.be.a('Date')
      }
    })

    it('should find things based on pagination page_size', async () => {
      const resultPageSize20 = await find('tenant-id', 'customer-id', {
        page: 1,
        page_size: 40
      })
      expect(resultPageSize20.page).to.equal(1)
      expect(resultPageSize20.pageSize).to.equal(40)
      expect(resultPageSize20.totalCount).to.equal(20)
      expect(resultPageSize20.totalPages).to.equal(1)
      expect(resultPageSize20.things).to.have.lengthOf(20)

      const resultPageSize5 = await find('tenant-id', 'customer-id', {
        page: 1,
        page_size: 5
      })
      expect(resultPageSize5.page).to.equal(1)
      expect(resultPageSize5.pageSize).to.equal(5)
      expect(resultPageSize5.totalCount).to.equal(20)
      expect(resultPageSize5.totalPages).to.equal(4)
      expect(resultPageSize5.things).to.have.lengthOf(5)
    })

    it('should find things based on type', async () => {
      const resultClassFix = await find('tenant-id', 'customer-id', {
        type: ['class_fix'],
        page: 1,
        page_size: 100
      })
      expect(resultClassFix.page).to.equal(1)
      expect(resultClassFix.pageSize).to.equal(100)
      expect(resultClassFix.totalCount).to.equal(20)
      expect(resultClassFix.totalPages).to.equal(1)
      expect(resultClassFix.things).to.have.lengthOf(20)
      for (let i = 0; i < 10; i++) {
        expect(resultClassFix.things[i].types).to.have.all.members([
          `class_${i}`,
          'class_fix'
        ])
      }

      const resultClass1 = await find('tenant-id', 'customer-id', {
        type: ['class_1'],
        page: 1,
        page_size: 100
      })
      console.log(resultClass1)
      expect(resultClass1.page).to.equal(1)
      expect(resultClass1.pageSize).to.equal(100)
      expect(resultClass1.totalCount).to.equal(1)
      expect(resultClass1.totalPages).to.equal(1)
      expect(resultClass1.things).to.have.lengthOf(1)
      expect(resultClass1.things[0].types).to.have.all.members([
        'class_1',
        'class_fix'
      ])
    })
  })

  describe('findOne', () => {
    it('should find a thing by its ID, tenant ID, and customer ID', async () => {})

    it('should throw ThingNotFound error if the thing is not found', async () => {})
  })

  describe('findOneOpenApi', () => {
    it('should find a Thing in the registry by ID and convert its description to OpenAPI format', async () => {})
  })

  describe('update', () => {
    it('should update a thing with the provided description, tenant ID, and customer ID', async () => {
      // Test case implementation
    })

    it('should throw ThingNotFound error if the thing is not found', async () => {
      // Test case implementation
    })

    it('should throw InvalidDescription error if the description is invalid', async () => {
      // Test case implementation
    })
  })

  describe('assignCustomer', () => {
    it('should assign a new customer to a thing', async () => {
      // Test case implementation
    })

    it('should throw ThingNotFound error if the thing is not found', async () => {
      // Test case implementation
    })
  })
})
