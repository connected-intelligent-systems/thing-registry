'use strict'

const thing = require('./thing')
const plugins = require('./plugin')
const discovery = require('./discovery')
const plugin = require('./plugin')
const permissions = require('./permissions')
const forward = require('./forward')
const affordances = require('./affordances')
const tickets = require('./tickets')
const events = require('./events')

exports = module.exports = {
  thing,
  plugins,
  discovery,
  plugin,
  permissions,
  forward,
  affordances,
  tickets,
  events
}
