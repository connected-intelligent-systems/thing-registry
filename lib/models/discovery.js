'use strict'

const { prisma } = require('../utils/prisma')

async function setRunning(owner, running) {
    return prisma.discovery.upsert({
        where: {
            user: owner
        },
        update: {
            running
        },
        create: {
            user: owner,
            running
        }
    })
}

async function updateDiscoveredThings(owner, discoveredThings) {
    return prisma.$transaction([
        prisma.discoveredThing.deleteMany({
            where: {
                owner
            }
        }),
        prisma.discoveredThing.createMany({
            data: discoveredThings
        })
    ])
}

async function isRunning(user) {
    return prisma.discovery.exists({
        user,
        running: true
    })
}

exports = module.exports = {
    setRunning,
    updateDiscoveredThings,
    isRunning
}