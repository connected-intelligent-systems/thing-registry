'use strict'

const env = require('env-var')
const redis = require('redis')

const RedisUrl = env.get('REDIS_URL').asString()
const RedisTopic = 'thing_registry'
let redisPublishClient

if (RedisUrl === undefined) {
  console.warn('Warning: No redis client set. Events disabled')
} else {
  redisPublishClient = redis.createClient(RedisUrl)
}

function sendEvent (message) {
  if (redisPublishClient !== undefined) {
    redisPublishClient.publish(RedisTopic, JSON.stringify(message))
  }
}

function sendCreateEvent (thing, tenantId) {
  sendEvent({
    eventType: 'create',
    ...thing,
    tenantId
  })
}

function sendRemoveEvent (thing, tenantId) {
  sendEvent({
    eventType: 'remove',
    ...thing,
    tenantId
  })
}

function sendUpdateEvent (thing, tenantId) {
  sendEvent({
    eventType: 'update',
    ...thing,
    tenantId
  })
}

exports = module.exports = {
  sendEvent,
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
}
