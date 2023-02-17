'use strict'

const { connect, createCollection } = require('../db')

const collectionName = 'pluginSettings'

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ pluginName: 1, user: 1 })
  await db.collection(collectionName).createIndex({ user: 1 })
}

/**
 * Update plugin settings for a specific user
 */
async function update (pluginName, user, settings, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).updateOne(
    { pluginName, user },
    {
      $set: {
        pluginName,
        user,
        settings
      }
    },
    { upsert: true, session }
  )
}

/**
 * Find plugin settings for a specific user
 */
async function findOne (pluginName, user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .findOne({ pluginName, user }, { session })
}

/**
 * Find all plugin settings for a specific user
 */
async function find (user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find({ user }, { session })
    .toArray()
}

/**
 * Find all plugin settings for names
 */
async function findByNames (names, user, { session } = {}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find(
      {
        user,
        pluginName: {
          $in: names
        }
      },
      { session }
    )
    .toArray()
}

exports = module.exports = {
  init,
  update,
  findOne,
  find,
  findByNames
}
