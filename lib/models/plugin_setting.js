'use strict'

const { prisma } = require('../utils/prisma')

async function get(owner, plugins) {
    return prisma.pluginSetting.findMany({
        where: {
            name: {
                in: plugins.map(plugin => plugin.info.name)
            },
            owner
        }
    })
}

exports = module.exports = {
    get
}