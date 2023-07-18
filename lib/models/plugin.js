'use strict'

const env = require('env-var')
const { readFileSync } = require('fs')

const Plugins = env
  .get('REGISTRY_PLUGINS')
  .default('')
  .asString()
  .split(';')

/**
 * Enum for different resource types
 * @readonly
 * @enum string
 */
const PluginTypes = Object.freeze({
  Discovery: 'DISCOVERY',
  Storage: 'STORAGE'
})

const installedPlugins = {}

/**
 * Reads meta data from the plugin package.json.
 * @param {string} name - Name of the plugin
 */
function readPackageJson (name) {
  const path = require.resolve(`${name}/package.json`)
  const file = readFileSync(path)
  const json = JSON.parse(file)
  return {
    name,
    version: json.version,
    author: json.author,
    description: json.description,
    previewImage: json.previewImage
  }
}

async function init () {
  await loadPlugins()
}

function validatePluginType (type) {
  return Object.values(PluginTypes).includes(type)
}

function validatePlugin (plugin) {
  switch (plugin.type) {
    case PluginTypes.Discovery:
      if (plugin.module.discover instanceof Function) {
        return true
      }
      break
    case PluginTypes.Storage:
      if (
        plugin.module.get instanceof Function &&
        plugin.module.update instanceof Function &&
        plugin.module.delete instanceof Function &&
        plugin.module.create instanceof Function
      ) {
        if (
          plugin.customTypes === undefined ||
          Array.isArray(plugin.customTypes)
        ) {
          return true
        }
      }
      break
  }
  return false
}

function createPlugin (init, module, info) {
  return {
    type: init.type,
    customTypes: init.customTypes,
    schema: init.schema,
    info,
    module,
    supportsAuthentication: () => {
      return module.authenticate !== undefined
    }
  }
}

/**
 * Load & initialize all plugins
 */
async function loadPlugins () {
  for (const pluginName of Plugins) {
    if (pluginName !== '') {
      try {
        const pluginInfo = readPackageJson(pluginName)
        if (pluginInfo.name === '') {
          console.error(`Invalid pluginname for plugin ${pluginName}`)
        }
        if (installedPlugins[pluginName] === undefined) {
          const pluginModule = require(pluginName)
          const init = await pluginModule.init({
            PluginTypes
          })
          if (validatePluginType(init.type)) {
            const plugin = createPlugin(init, pluginModule, pluginInfo)
            if (validatePlugin(plugin) === true) {
              installedPlugins[pluginName] = plugin
              console.log(`Plugin initialized ${pluginName}`)
            }
          }
        }
      } catch (e) {
        console.error('Failed to initialize plugin', pluginName, e)
      }
    }
  }
}

async function find (type) {
  const plugins = Object.keys(installedPlugins || {}).map(name => ({
    ...installedPlugins[name]
  }))

  if (type !== undefined) {
    return plugins.filter(plugin => plugin.type === type)
  }

  return plugins
}

async function findDiscovery () {
  return find(PluginTypes.Discovery)
}

async function findStorage () {
  return find(PluginTypes.Storage)
}

async function findOne (id) {
  return installedPlugins[id]
}

exports = module.exports = {
  init,
  find,
  findDiscovery,
  findStorage,
  findOne
}
