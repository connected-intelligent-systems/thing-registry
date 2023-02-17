'use strict'

const { connect, createCollection } = require('../db')
const collectionName = 'securityDefinitions'

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ name: 1, thingId: 1 })
  await db.collection(collectionName).createIndex({ thingId: 1 })
}

async function insertMany (securityDefinitions, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .insertMany(securityDefinitions, { session })
}

async function updateMany (thingId, securityDefinitions, { session } = {}) {
  await removeByThingId(thingId, { session })
  await insertMany(securityDefinitions, { session })
}

async function removeByThingId (thingId, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).deleteMany({ thingId }, { session })
}

async function findOne ({ thingId, name }, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).findOne({ thingId, name }, { session })
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
