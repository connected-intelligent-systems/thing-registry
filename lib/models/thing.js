'use strict'

const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')
const { getTypes } = require('../utils/thing_description')

const collectionName = 'things'

async function init () {
  const db = await createCollection(collectionName)
  await db
    .collection(collectionName)
    .createIndex({ id: 1, tenantId: 1 }, { unique: true })
}

async function findByIds (ids, { session, type, resolve, tenantId } = {}) {
  const query = {
    types: Array.isArray(type) ? { $all: type } : type,
    tenantId
  }
  const projection = {
    description: resolve === true ? 1 : undefined,
    types: { $ifNull: ['$types', []] },
    id: 1,
    title: 1,
    _id: 0
  }
  const pipeline = [
    {
      $match: {
        id: { $in: ids },
        ...cleanObject(query)
      }
    },
    {
      $project: {
        ...cleanObject(projection)
      }
    }
  ]

  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate(pipeline, { session })
    .toArray()
}

async function findAll ({ projection } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find({}, { projection })
    .toArray()
}

async function findOne (id, tenantId) {
  const db = await connect()
  const description = await db
    .collection(collectionName)
    .findOne({ id, tenantId }, { projection: { _id: 0 } })
  return description
}

async function existsById (id, tenantId) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .findOne({ id, tenantId }, { projection: { _id: 0, id: 1 } })
  return result !== null
}

async function create (description, tenantId, { session, source } = {}) {
  const db = await connect()
  return db.collection(collectionName).insertOne(
    {
      description,
      tenantId,
      id: description.id,
      types: getTypes(description),
      title: description.title,
      source
    },
    { session }
  )
}

async function update (description, tenantId, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).findOneAndUpdate(
    { id: description.id, tenantId },
    {
      $set: {
        description,
        types: getTypes(description),
        title: description.title
      }
    },
    { session, projection: { id: 1 } }
  )
}

async function deleteById (id, tenantId, { session } = {}) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .deleteOne({ id, tenantId }, { session })
  return result.deletedCount === 1
}

exports = module.exports = {
  init,
  findByIds,
  findAll,
  findOne,
  existsById,
  create,
  update,
  deleteById
}
