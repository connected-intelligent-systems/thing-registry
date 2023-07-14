'use strict'

const env = require('env-var')

const CredentialsStoragePluginName = env
  .get('REGISTRY_CREDENTIALS_STORAGE_PLUGIN')
  .default('mongodb-credentials')
  .required(true)
  .asString()
const CredentialsStoragePlugin = require(CredentialsStoragePluginName)

async function init () {
  if (validate(CredentialsStoragePlugin) === false) {
    throw Error(
      `Invalid credentials storage plugin ${CredentialsStoragePluginName}`
    )
  }

  if (CredentialsStoragePlugin.init !== undefined) {
    CredentialsStoragePlugin.init()
  }
}

function validate (plugin) {
  if (
    plugin.update instanceof Function &&
    plugin.get instanceof Function &&
    plugin.delete instanceof Function
  ) {
    return true
  }
  return false
}

async function update (path, credentials = {}) {
  return CredentialsStoragePlugin.update(path, credentials)
}

async function remove (path) {
  return CredentialsStoragePlugin.delete(path)
}

async function get (path) {
  return CredentialsStoragePlugin.get(path)
}

exports = module.exports = {
  init,
  update,
  delete: remove,
  get
}
