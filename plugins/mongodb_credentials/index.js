'use strict'

const connect = require('../../lib/db/connect')

const collectionName = 'credentials'

async function init () {}

async function update (path, data) {
  const db = await connect()
  return db
    .collection(collectionName)
    .updateOne({ path }, { $set: { path, data } }, { upsert: true })
}

async function get (path) {
  const db = await connect()
  const result = await db.collection(collectionName).findOne({ path })
  if (result === null) {
    return undefined
  } else {
    return result.data
  }
}

async function remove (path) {
  const db = await connect()
  return db.collection(collectionName).deleteOne({ path })
}

exports = module.exports = {
  init,
  update,
  get,
  delete: remove
}
