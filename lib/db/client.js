'use strict'

const { MongoClient } = require('mongodb')
const env = require('env-var')
const url = env
  .get('MONGODB_URL')
  .default('mongodb://mongo:27017/?replicaSet=rs0')
  .asString()
const username = env.get('MONGODB_USER').asString()
const password = env.get('MONGODB_PASSWORD').asString()

/**
 * Returns credentials for the database, if set
 */
function getCredentials () {
  if (username !== undefined && password !== undefined) {
    return {
      username,
      password
    }
  }
}

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  auth: getCredentials()
})

exports = module.exports = client
