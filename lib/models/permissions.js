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

async function init() {
  const db = await createCollection(collectionName)
  await db
    .collection(collectionName)
    .createIndex({ thingIds: 1, entityId: 1, scope: 1 })
  await db
    .collection(collectionName)
    .createIndex({ thingIds: 1, entityId: 1, owner: 1, scope: 1 })
}

async function isOwner(id, owner) {
  const db = await connect()
  return Boolean(
    await db.collection(collectionName).findOne({
      _id: ObjectId(id),
      owner
    })
  )
}

async function create(
  { owner, resourceId, type, scopes, entityId, entityName, immutable },
  { session } = {}
) {
  const db = await connect()
  return db.collection(collectionName).insertOne(
    {
      owner,
      resourceId,
      type,
      scopes,
      entityId,
      entityName,
      immutable
    },
    { session }
  )
}

async function remove(id, { session } = {}) {
  const db = await connect()
  const result = await db
    .collection(collectionName)
    .deleteOne({ id, immutable: false }, { session })
  return result.deletedCount === 1
}

async function deleteMany(thingId, { session } = {}) {
  const db = await connect()
  const result = await db.collection(collectionName).deleteOne(
    {
      resourceId: {
        regex: `${thingId}.*`
      }
    },
    { session }
  )
  return result.deletedCount === 1
}

async function findOne(id, owner) {
  const db = await connect()
  return db.collection(collectionName).findOne(
    {
      _id: ObjectId(id),
      owner
    },
    {
      projection: {
        id: '$_id',
        thingIds: 1,
        affordances: 1,
        entityId: 1,
        entityName: 1,
        scopes: 1,
        immutable: 1
      }
    }
  )
}

async function find({
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
            thingIds: {
              $in: thingIds
            }
          })
        })
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          owner: 1,
          resourceId: 1,
          type: 1,
          scopes: 1,
          entityId: 1,
          entityName: 1,
          immutable: 1
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

async function evaluatePermissions({
  entityId,
  thingIds,
  affordanceIds,
  scope,
  page,
  pageSize
}) {
  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate([
      // select all permissions where the user or group is involved
      {
        $match: cleanObject({
          entityId,
          ...(scope && {
            scopes: {
              $in: scope
            }
          })
        })
      },
      // join all things based on the owner on the permission
      {
        $lookup: {
          from: 'things',
          let: { owner: '$owner', thingIds: '$thingIds', affordances: '*' },
          as: 'things',
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$owner', '$$owner'] }
              }
            },
            {
              $project: {
                _id: 0,
                id: 1,
                affordances: {
                  $concatArrays: [
                    {
                      $map: {
                        input: {
                          $objectToArray: {
                            $ifNull: ['$description.properties', {}]
                          }
                        },
                        as: 'property',
                        in: { $concat: ['$id', '/properties/', '$$property.k'] }
                      }
                    },
                    {
                      $map: {
                        input: {
                          $objectToArray: {
                            $ifNull: ['$description.actions', {}]
                          }
                        },
                        as: 'action',
                        in: { $concat: ['$id', '/actions/', '$$action.k'] }
                      }
                    },
                    {
                      $map: {
                        input: {
                          $objectToArray: {
                            $ifNull: ['$description.events', {}]
                          }
                        },
                        as: 'event',
                        in: { $concat: ['$id', '/events/', '$$event.k'] }
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      },
      // unwind found things and affordances
      {
        $unwind: '$things'
      },
      {
        $unwind: '$things.affordances'
      },
      // filter with ids from the permission itself and from the user
      {
        $match: {
          $expr: {
            $cond: {
              if: { $in: ['*', '$thingIds'] },
              then: true,
              else: { $in: ['$things.id', '$thingIds'] }
            }
          },
          ...(thingIds && {
            'things.id': {
              $in: thingIds
            }
          }),
          $expr: {
            $cond: {
              if: { $in: ['*', '$affordances'] },
              then: true,
              else: { $in: ['$things.affordances', '$affordances'] }
            }
          },
          ...(affordanceIds && {
            'things.affordances': {
              $in: affordanceIds
            }
          })
        }
      },
      {
        $group: {
          _id: '$things.id',
          affordances: {
            $push: '$things.affordances'
          },
          scopes: {
            $first: '$scopes'
          },
          owner: {
            $first: '$owner'
          }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          affordances: 1,
          scopes: 1,
          owner: 1
        }
      },
      { $sort: { _id: 1 } },
      ...(page && pageSize
        ? [
          {
            $facet: {
              entries: [
                { $skip: (page - 1) * pageSize },
                { $limit: pageSize }
              ],
              totalCount: [{ $count: 'count' }]
            }
          },
          { $unwind: '$totalCount' }
        ]
        : [])
    ])
    .toArray()
}

async function checkPermissions({ thingId, entityId, scope }) {
  const result = await evaluatePermissions({
    thingIds: [thingId],
    scopes: [scope],
    entityId
  })

  return result.length > 0
}

async function hasReadPermissions({ thingId, entityId }) {
  return checkPermissions({
    thingId,
    scope: 'read',
    entityId
  })
}

async function hasUpdatePermission({ thingId, entityId }) {
  return checkPermissions({
    thingId,
    scope: 'update',
    entityId
  })
}

async function hasDeletePermissions({ thingId, entityId }) {
  return checkPermissions({
    thingId,
    scope: 'delete',
    entityId
  })
}

async function hasProxyPermissions({ thingId, entityId }) {
  return checkPermissions({
    thingId,
    scope: 'proxy',
    entityId
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
  hasProxyPermissions,
  find,
  findOne,
  isOwner,
  evaluatePermissions
}
