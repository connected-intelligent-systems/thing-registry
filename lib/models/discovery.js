'use strict'

const { connect, createCollection } = require('../db')

const collectionName = 'discoveries'

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ user: 1 })
}

async function run (user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .updateOne(
      { user },
      { $set: { user, running: true } },
      { upsert: true, session }
    )
}

async function finish (user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .updateOne(
      { user },
      { $set: { user, running: false } },
      { upsert: true, session }
    )
}

async function isRunning (user, { session } = {}) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .findOne({ user, running: true }, { session })
  return result !== null
}

async function findOne (user, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).findOne({ user }, { session })
}

exports = module.exports = {
  init,
  run,
  finish,
  isRunning,
  findOne
}
