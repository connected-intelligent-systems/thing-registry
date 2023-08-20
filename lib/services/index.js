'use strict'

const thing = require('./thing')
const discovery = require('./discovery')
const credentials = require('./credentials')
const forward = require('./forward')
const events = require('./events')
const inbox = require('./inbox')

exports = module.exports = {
  thing,
  discovery,
  credentials,
  forward,
  events,
  inbox
}
