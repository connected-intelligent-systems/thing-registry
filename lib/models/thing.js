'use strict'

const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')
const { getTypes } = require('../utils/thing_description')
const toArray = require('../utils/to_array')

const collectionName = 'things'

async function init () {
  const db = await createCollection(collectionName)
  await db
    .collection(collectionName)
    .createIndex({ id: 1, owner: 1 }, { unique: true })
  await db.collection(collectionName).createIndex({ id: 1 }, { unique: true })
}

async function findByIds (
  ids,
  { session, type, resolve, owner, protocol, host, path } = {}
) {
  const query = {
    types: Array.isArray(type) ? { $all: type } : type,
    owner: owner ? { $in: toArray(owner) } : undefined
  }
  const projection = {
    description: resolve === true ? 1 : undefined,
    types: { $ifNull: ['$types', []] },
    id: 1,
    owner: '$username',
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
    },
    {
      $addFields: {
        href: {
          $concat: [`${protocol}://${host}${path}/`, '$id']
        }
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

async function findOne (id) {
  const db = await connect()
  const description = await db
    .collection(collectionName)
    .findOne({ id }, { projection: { _id: 0 } })
  return description
}

async function existsById (id, owner) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .findOne(
      { id, ...(owner !== undefined && { owner }) },
      { projection: { _id: 0, id: 1 } }
    )
  return result !== null
}

async function create (description, owner, username, { session, source } = {}) {
  const db = await connect()
  return db.collection(collectionName).insertOne(
    {
      description,
      owner,
      username,
      id: description.id,
      types: getTypes(description),
      title: description.title,
      source
    },
    { session }
  )
}

async function update (description, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).findOneAndUpdate(
    { id: description.id },
    {
      $set: {
        description,
        types: getTypes(description),
        title: description.title
      }
    },
    { session, projection: { source: 1, owner: 1, username: 1 } }
  )
}

async function deleteById (id, { session } = {}) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .deleteOne({ id }, { session })
  return result.deletedCount === 1
}

async function isOwner (id, owner) {
  const db = await connect()
  return Boolean(
    await db.collection(collectionName).findOne({
      id,
      owner
    })
  )
}

exports = module.exports = {
  init,
  findByIds,
  findAll,
  findOne,
  existsById,
  create,
  update,
  deleteById,
  isOwner
}
