'use strict'

const { ObjectId } = require('mongodb')
const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')

const collectionName = 'permissions'

const PermissionScopes = Object.freeze([
  'read',
  'update',
  'delete',
  'proxy',
  'history'
])

async function init () {
  const db = await createCollection(collectionName)
  await db
    .collection(collectionName)
    .createIndex({ thingId: 1, entityId: 1, scope: 1 })
  await db
    .collection(collectionName)
    .createIndex({ thingId: 1, entityId: 1, owner: 1, scope: 1 })
}

async function create (
  { thingId, scopes, entityId, entityName, owner, immutable },
  { session } = {}
) {
  const db = await connect()
  return db.collection(collectionName).insertOne(
    {
      thingId,
      entityId,
      entityName,
      scopes,
      owner,
      immutable
    },
    { session }
  )
}

async function remove (id, { session } = {}) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .deleteOne({ id, immutable: false }, { session })
  return result.deletedCount === 1
}

async function deleteMany (thingId, { session } = {}) {
  const db = await connect()
  const result = await db.collection(collectionName).deleteOne(
    {
      thingId
    },
    { session }
  )
  return result.deletedCount === 1
}

async function checkPermissions ({ thingId, entityId, scope }) {
  const db = await connect()
  return Boolean(
    await db.collection(collectionName).findOne(
      {
        scopes: scope,
        $or: [
          { owner: entityId },
          {
            thingId,
            entityId,
            ...(scope && {
              scopes: scope
            })
          }
        ]
      },
      { projection: { _id: 1 } }
    )
  )
}

async function hasReadPermissions ({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'read', entityId })
}

async function hasUpdatePermission ({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'update', entityId })
}

async function hasDeletePermissions ({ thingId, entityId }) {
  return checkPermissions({ thingId, scope: 'delete', entityId })
}

async function hasProxyPermissions ({ thingId, entityId }) {
  return checkPermissions({
    thingId,
    scope: 'proxy',
    entityId
  })
}

async function findOne (id, owner) {
  const db = await connect()
  return db.collection(collectionName).findOne(
    {
      _id: ObjectId(id),
      owner
    },
    {
      projection: {
        id: '$_id',
        thingId: 1,
        entityId: 1,
        entityName: 1,
        scopes: 1,
        immutable: 1
      }
    }
  )
}

async function find ({
  entityId,
  thingIds,
  scope,
  owner,
  page,
  page_size: pageSize
}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate([
      {
        $match: cleanObject({
          entityId,
          scopes: scope,
          owner,
          ...(thingIds && {
            thingId: {
              $in: thingIds
            }
          })
        })
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          thingId: 1,
          entityName: 1,
          scopes: 1
        }
      },
      { $sort: { _id: 1 } },
      {
        $facet: {
          entries: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: 'count' }]
        }
      },
      { $unwind: '$totalCount' }
    ])
    .toArray()
}

async function findUnpaginated ({ entityId, thingIds, scope }) {
  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate([
      {
        $match: cleanObject({
          entityId,
          ...(scope && {
            scopes: {
              $in: scope
            }
          }),
          ...(thingIds && {
            thingId: {
              $in: thingIds
            }
          })
        })
      },
      {
        $project: {
          _id: 0,
          thingId: 1
        }
      }
    ])
    .toArray()
}

async function listReadableThings ({
  entityId,
  thingIds,
  scope = 'read',
  owner,
  page = 0,
  pageSize = 50
}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate([
      {
        $match: cleanObject({
          entityId,
          scopes: scope,
          owner,
          ...(thingIds && {
            thingId: {
              $in: thingIds
            }
          })
        })
      },
      { $group: { _id: '$thingId' } },
      { $sort: { _id: 1 } },
      {
        $facet: {
          entries: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: 'count' }]
        }
      },
      { $unwind: '$totalCount' }
    ])
    .toArray()
}

async function isOwner (id, owner) {
  const db = await connect()
  return Boolean(
    await db.collection(collectionName).findOne({
      _id: ObjectId(id),
      owner
    })
  )
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
  hasProxyPermissions,
  find,
  findOne,
  findUnpaginated,
  listReadableThings,
  isOwner
}
