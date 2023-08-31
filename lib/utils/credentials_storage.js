'use strict'

const { credentials } = require('../models')

class CredentialsStorage {
  constructor (plugin, tenantId) {
    this._plugin = plugin
    this._tenantId = tenantId
  }

  get path () {
    return `${this._plugin}/${this._tenantId}`
  }

  async get () {
    return credentials.get(this.path)
  }

  async update (data) {
    await credentials.update(this.path, data)
  }
}

exports = module.exports = CredentialsStorage
