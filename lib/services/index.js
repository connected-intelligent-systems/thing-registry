'use strict'

const thing = require('./thing')
const plugins = require('./plugin')
const discovery = require('./discovery')
const plugin = require('./plugin')
const forward = require('./forward')
const affordances = require('./affordances')
const permissions = require('./permissions')

exports = module.exports = {
  thing,
  plugins,
  discovery,
  plugin,
  forward,
  affordances,
  permissions
}
