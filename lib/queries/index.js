'use strict'

const plugin = require('./plugin')
const discovery = require('./discovery')
const pluginSetting = require('./plugin_setting')
const discoveredThing = require('./discovered_thing')
const affordance = require('./affordance')
const target = require('./target')
// const permission = require('./permission')

exports = module.exports = {
  ...plugin,
  ...discovery,
  ...pluginSetting,
  ...discoveredThing,
  ...affordance,
  ...target
  // ...permission
}
