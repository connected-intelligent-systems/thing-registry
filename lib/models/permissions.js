'use strict'

const { connect, createCollection } = require('../db')
const cleanObject = require('../utils/clean_object')

const collectionName = 'permissions'

const PermissionScopes = Object.freeze(['read', 'update', 'delete', 'invoke'])

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ user: 1 })
}

async function create (
  {
    thingId,
    scopes,
    entityId,
    entityName,
    owner,
    properties,
    actions,
    events,
    immutable
  },
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
      immutable,
      properties: properties || [],
      actions: actions || [],
      events: events || []
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

async function checkPermissions ({
  thingId,
  entityId,
  scope,
  properties,
  actions,
  events
}) {
  const db = await connect()
  return Boolean(
    await db.collection(collectionName).findOne(
      {
        thingId,
        entityId,
        scopes: scope,
        ...(properties && {
          $or: [{ properties }, { properties: '*' }]
        }),
        ...(actions && {
          $or: [{ actions }, { actions: '*' }]
        }),
        ...(events && {
          $or: [{ events }, { events: '*' }]
        })
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

async function hasInvokePermissions ({
  thingId,
  properties,
  actions,
  events,
  entityId
}) {
  return checkPermissions({
    thingId,
    scope: 'invoke',
    entityId,
    properties,
    actions,
    events
  })
}

async function findOne ({ entityId, thingId }) {
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
        }),
      },
      { $project: {
        _id: 0,
        id: '$_id',
        thingId: 1,
        entityName: 1,
        scopes: 1,
        properties: 1,
        actions: 1,
        events: 1
      }},
      { $sort: { _id: 1 } },
      {
        $facet: {
          entries: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: 'count' }]
        }
      },
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
          things: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ])
    .toArray()
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
  hasInvokePermissions,
  find,
  findOne,
  listReadableThings
}
