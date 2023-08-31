'use strict'

const thing = require('./thing')
const publicThing = require('./public_thing')
const discovery = require('./discovery')
const credentials = require('./credentials')
const forward = require('./forward')
const events = require('./events')
const inbox = require('./inbox')

exports = module.exports = {
  thing,
  publicThing,
  discovery,
  credentials,
  forward,
  events,
  inbox
}
