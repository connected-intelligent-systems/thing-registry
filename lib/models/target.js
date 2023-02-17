'use strict'

const { connect, createCollection } = require('../db')

const collectionName = 'targets'

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ thingId: 1 })
  await db
    .collection(collectionName)
    .createIndex({ thingId: 1, type: 1, name: 1, index: 1 })
}

async function insertMany (targets, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).insertMany(targets, { session })
}

async function updateMany (thingId, targets, { session } = {}) {
  await removeByThingId(thingId, { session })
  await insertMany(targets, { session })
}

async function removeByThingId (thingId, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).deleteMany({ thingId }, { session })
}

async function findOne ({ thingId, type, name, index }, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .findOne({ thingId, type, name, index: +index }, { session })
}

async function find (thingId, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find({ thingId }, { session })
    .toArray()
}

async function authorize (
  { thingId, type, name, index, authorized },
  { session } = {}
) {
  const db = await connect()
  return db
    .collection(collectionName)
    .updateOne(
      { thingId, type, name, index: +index },
      { $set: { authorized } },
      { session }
    )
}

exports = module.exports = {
  init,
  insertMany,
  updateMany,
  removeByThingId,
  findOne,
  find,
  authorize
}
