'use strict'

const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')

const collectionName = 'inbox'

async function init () {
  const db = await createCollection(collectionName)
  await db
    .collection(collectionName)
    .createIndex({ 'description.id': 1, user: 1 })
  await db.collection(collectionName).createIndex({ user: 1 })
}

async function removeMany (source, user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .deleteMany({ user, source }, { session })
}

async function removeOne (user, id, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .deleteMany({ user, 'description.id': id }, { session })
}

async function insertMany (user, things, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).bulkWrite(
    things.map(thing => ({
      updateOne: {
        filter: { 'description.id': thing.description.id, user },
        update: { $set: thing },
        upsert: true
      }
    })),
    { session }
  )
}

async function find (user, query, { session } = {}) {
  const db = await connect()
  const projection = {
    id: 1,
    foundAt: 1,
    source: 1,
    description: query.resolve ? 1 : undefined
  }
  const results = await db
    .collection(collectionName)
    .find({ user }, { session, projection: cleanObject(projection) })
    .toArray()
  return results.map(result => ({
    id: result.id,
    foundAt: result.foundAt,
    description: result.description,
    source: result.source
  }))
}

async function findOne (user, id) {
  const db = await connect()
  return db
    .collection(collectionName)
    .findOne(
      { user, 'description.id': id },
      { projection: { _id: 0, user: 0 } }
    )
}

exports = module.exports = {
  init,
  removeMany,
  removeOne,
  insertMany,
  find,
  findOne
}
