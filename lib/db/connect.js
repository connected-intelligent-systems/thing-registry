'use strict'

const env = require('env-var')
const client = require('./client')

const dbName = env
  .get('MONGODB_DB')
  .default('registry')
  .asString()

let connection = null

async function connect () {
  if (!connection) {
    connection = await client.connect()
  }
  return connection.db(dbName)
}

exports = module.exports = connect
