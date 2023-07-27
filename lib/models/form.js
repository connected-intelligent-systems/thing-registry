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
  if (targets.length > 0) {
    const db = await connect()
    return db.collection(collectionName).insertMany(targets, { session })
  } else {
    return Promise.resolve()
  }
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

exports = module.exports = {
  init,
  insertMany,
  updateMany,
  removeByThingId,
  findOne,
  find
}
