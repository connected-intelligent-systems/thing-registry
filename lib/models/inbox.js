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

async function updateMany (id, user, discoveredThings, { session }) {
  if (discoveredThings.length > 0) {
    await removeMany(id, user, { session })
    await insertMany(user, discoveredThings, {
      session
    })
  }
}

async function find (
  user,
  { page, page_size: pageSize, resolve },
  { session } = {}
) {
  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate(
      [
        {
          $match: { user }
        },
        {
          $project: cleanObject({
            _id: 0,
            id: 1,
            foundAt: 1,
            source: 1,
            title: 1,
            types: { $ifNull: ['$types', []] },
            description: resolve ? 1 : undefined
          })
        },
        { $sort: { _id: 1 } },
        {
          $facet: {
            entries: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
            totalCount: [{ $count: 'count' }]
          }
        },
        { $unwind: '$totalCount' }
      ],
      { session }
    )
    .toArray()
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
  updateMany,
  find,
  findOne
}
