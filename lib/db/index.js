'use strict'

const client = require('./client')
const connect = require('./connect')

async function createCollection (collectionName) {
  const db = await connect()
  try {
    await db.createCollection(collectionName)
    return db
  } catch (e) {
    if (e.code === 48) {
      return db
    }
    throw e
  }
}

exports = module.exports = {
  client,
  connect,
  createCollection
}
