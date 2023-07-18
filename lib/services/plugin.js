'use strict'

const models = require('../models')
const Ajv = require('ajv')
const {
  PluginNotFound,
  InvalidPluginSettings
} = require('../utils/http_errors')

const ajv = new Ajv({ useDefaults: true })
const DefaultSchema = {
  type: 'object',
  additionalProperties: false
}

const { PrismaClient, ThingAuthorizationScope } = require('@prisma/client')
const prisma = new PrismaClient()

async function find () {
  const plugins = await models.plugin.find()
  return plugins.map(plugin => ({
    ...plugin.info
  }))
}

async function findOne (id, user) {
  const plugin = await models.plugin.findOne(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }
  const { settings } = await getSettings(id, user)
  return {
    ...plugin.info,
    schema: plugin.schema,
    settings
  }
}

async function updateSettings (id, settings, user) {
  const plugin = await models.plugin.findOne(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const valid = ajv.validate(plugin.schema || DefaultSchema, settings)
  if (valid) {
    await prisma.pluginSetting.update({
      where: {
        name: id,
        owner: user
      },
      data: {
        settings
      }
    })
    if (plugin.updateSettings !== undefined) {
      await plugin.updateSettings(plugin.context)
    }
  } else {
    throw new InvalidPluginSettings()
  }
}

async function getSettings (id, user) {
  const plugin = await models.plugin.findOne(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const pluginSettings = await prisma.pluginSetting.findFirst({
    where: {
      name: id,
      owner: user
    }
  })
  const settings = pluginSettings || {}
  ajv.validate(plugin.schema || DefaultSchema, settings)
  return settings
}

async function findWithCustomType (type) {
  const plugins = await models.plugin.findStorage()
  return plugins.find(plugin => plugin.customTypes.include(type))
}

async function findWithCustomTypes () {
  const plugins = await models.plugin.findStorage()
  return plugins.filter(plugin => plugin.customTypes !== undefined)
}

exports = module.exports = {
  find,
  findOne,
  updateSettings,
  getSettings,
  findWithCustomType,
  findWithCustomTypes
}
