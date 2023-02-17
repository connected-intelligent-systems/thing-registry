'use strict'

const env = require('env-var')
const VaultUrl = env
  .get('VAULT_URL')
  .default('http://vault:8200')
  .asString()
const VaultToken = env
  .get('VAULT_TOKEN')
  .default('00000000-0000-0000-0000-000000000000')
  .asString()
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: VaultUrl,
  token: VaultToken
})

/**
 * Write data to the vault
 * @param {string} path - path to the secret e.g. /urn:example:uuid/secret
 * @param {string} data - the data to write as string
 * @returns {string} - parsed yaml file
 */
async function update (path, data) {
  return vault.write(`secret/data/${path}`, { data })
}

/**
 * Reads data from the vault
 * @param {string} path - path to the secret e.g. /urn:example:uuid/secret
 * @returns {string} - the data from vault
 */
async function get (path) {
  try {
    const response = await vault.read(`secret/data/${path}`)
    return response.data.data // WTF
  } catch (e) {
    return undefined
  }
}

/**
 * Removes data from the vault
 * @param {string} path - path to delete
 */
async function remove (path) {
  return vault.delete(`secret/data/${path}`)
}

/**
 * Initialize the plugin
 * @param {*} param0
 * @returns
 */
async function init () {}

exports = module.exports = {
  init,
  update,
  get,
  delete: remove
}
