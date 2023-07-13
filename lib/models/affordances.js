'use strict'

const cleanObject = require('../utils/clean_object')
const { connect, createCollection } = require('../db')
const toArray = require('../utils/to_array')

const collectionName = 'affordances'

function getType (unexposed) {
  if (unexposed === true) {
    return 'unexposed'
  } else {
    return 'exposed'
  }
}

async function init () {
  const db = await createCollection(collectionName)
  await db.collection(collectionName).createIndex({ user: 1 })
}

async function insertMany (affordances, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).insertMany(affordances, { session })
}

async function updateMany (thingId, affordances, { session } = {}) {
  await removeByThingId(thingId, { session })
  await insertMany(affordances, { session })
}

async function removeByThingId (thingId, { session } = {}) {
  const db = await connect()
  return db.collection(collectionName).deleteMany({ thingId }, { session })
}

async function findByIds (
  ids,
  {
    session,
    type,
    affordanceType,
    limit,
    skip,
    resolve,
    resolveThing,
    unexposed,
    owner
  } = {}
) {
  const query = {
    types: Array.isArray(type) ? { $all: type } : type,
    thingId: { $in: ids },
    username: owner ? { $in: toArray(owner) } : undefined,
    affordanceType
  }
  const projection = {
    description: resolve === true ? `$${getType(unexposed)}` : undefined,
    types: { $ifNull: ['$types', []] },
    owner: '$username',
    name: 1,
    thingId: 1,
    affordanceType: 1,
    thingDescription:
      resolveThing === true
        ? `$thingDescription.${getType(unexposed)}`
        : undefined,
    _id: 0
  }
  const pipeline = [
    {
      $match: {
        ...cleanObject(query)
      }
    }
  ]

  if (resolveThing === true) {
    pipeline.push(
      {
        $lookup: {
          from: 'things',
          localField: 'thingId',
          foreignField: 'id',
          as: 'thingDescription'
        }
      },
      {
        $unwind: '$thingDescription'
      }
    )
  }

  pipeline.push({
    $project: {
      ...cleanObject(projection)
    }
  })

  if (limit !== undefined) {
    pipeline.push({ $limit: +limit })
  }

  if (skip !== undefined) {
    pipeline.push({ $skip: +skip })
  }

  const db = await connect()
  return db
    .collection(collectionName)
    .aggregate(pipeline, { session })
    .toArray()
}

exports = module.exports = {
  init,
  insertMany,
  updateMany,
  removeByThingId,
  findByIds
}
