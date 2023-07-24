'use strict'

const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')

const collectionName = 'permissions'

const PermissionScopes = Object.freeze([
  'read',
  'update',
  'delete',
  'readProperties',
  'invokeActions',
  'subscribeEvents'
])

async function init() {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ user: 1 })
}

async function create({ thingId, scopes, entityId, owner }, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).insertOne(
    {
      thingId,
      entityId,
      scopes,
      owner
    },
    { session }
  )
}

async function remove(id, { session } = {}) {
  const db = await connect()
  const { result } = await db
    .collection(collectionName)
    .deleteOne({ id }, { session })
  return result.ok === 1 && result.n > 0
}

async function deleteMany(thingId, { session } = {}) {
  const db = await connect()
  const { result } = await db.collection(collectionName).deleteOne(
    {
      thingId
    },
    { session }
  )
  return result.ok === 1 && result.n > 0
}

async function checkPermissions({ thingId, entityId, scope }) {
  const db = await connect()
  return db.collection(collectionName).findOne({
    thingId,
    entityId,
    scopes: scope
  })
}

async function hasReadPermissions({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'read', entityId })
}

async function hasUpdatePermission({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'update', entityId })
}

async function hasDeletePermissions({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'delete', entityId })
}

async function hasExecutePermissions({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'execute', entityId })
}

async function find({ thingId, scope, owner }) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find(cleanObject({
      thingId,
      scopes: scope,
      owner
    }), {
      projection: {
        _id: 0,
        id: "$_id",
        thingId: 1,
        entityId: 1,
        scopes: 1
      }
    })
    .toArray()
}

async function findOne({ entityId, thingId }) {
  const db = await connect()
  return db
    .collection(collectionName)
    .find(
      {
        entityId,
        thingId
      },
      {
        projection: {
          _id: 0,
          thingId: 0,
          entityId: 0
        }
      }
    )
    .toArray()
}

async function listReadableThings({ entityId }) {
  return find({
    entityId,
    scope: 'read'
  })
}

async function listReadableAffordances({ entityId }) {
  return find({
    entityId,
    scope: 'read'
  })
}

exports = module.exports = {
  PermissionScopes,
  init,
  create,
  delete: remove,
  deleteMany,
  hasDeletePermissions,
  hasReadPermissions,
  hasUpdatePermission,
  hasExecutePermissions,
  find,
  findOne,
  listReadableThings,
  listReadableAffordances
}
