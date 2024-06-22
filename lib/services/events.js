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

/**
 * Sends an event message to the Redis pub/sub channel.
 * @param {Object} message - The event message to be sent.
 */
function sendEvent (message) {
  if (redisPublishClient !== undefined) {
    redisPublishClient.publish(RedisTopic, JSON.stringify(message))
  }
}

/**
 * Sends a create event for a thing with the specified tenant ID.
 * @param {Object} thing - The thing object to be created.
 * @param {string} tenantId - The ID of the tenant.
 */
function sendCreateEvent (thing, tenantId) {
  sendEvent({
    eventType: 'create',
    ...thing,
    tenantId
  })
}

/**
 * Sends a remove event for a thing with the specified tenant ID.
 * @param {Object} thing - The thing object to be removed.
 * @param {string} tenantId - The ID of the tenant.
 */
function sendRemoveEvent (thing, tenantId) {
  sendEvent({
    eventType: 'remove',
    ...thing,
    tenantId
  })
}

/**
 * Sends an update event for a thing with the specified tenant ID.
 * @param {Object} thing - The thing object to be updated.
 * @param {string} tenantId - The ID of the tenant.
 */
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
