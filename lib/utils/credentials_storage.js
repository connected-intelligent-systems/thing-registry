'use strict'

const { credentials } = require('../models')

class CredentialsStorage {
  constructor (plugin, user) {
    this._plugin = plugin
    this._user = user
  }

  get path () {
    return `${this._plugin}/${this._user}`
  }

  async get () {
    return credentials.get(this.path)
  }

  async update (data) {
    await credentials.update(this.path, data)
  }
}

exports = module.exports = CredentialsStorage
