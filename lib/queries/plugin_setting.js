'use strict'

const { prisma } = require('../utils/prisma')

async function getSettingsForPlugins (owner, plugins) {
  return prisma.pluginSetting.findMany({
    where: {
      name: {
        in: plugins.map(plugin => plugin.info.name)
      },
      owner
    }
  })
}

async function updatePluginSettings (owner, name, settings) {
  return prisma.pluginSetting.update({
    where: {
      name,
      owner
    },
    data: {
      settings
    }
  })
}

async function getPluginSettings (owner, name) {
  return prisma.pluginSetting.update({
    where: {
      name,
      owner
    }
  })
}

exports = module.exports = {
  getSettingsForPlugins,
  updatePluginSettings,
  getPluginSettings
}
