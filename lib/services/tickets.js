'use strict'

const models = require('../models')
const {
  ThingNotFoundError,
  TicketsNotFound,
  InvalidTicket
} = require('../utils/http_errors')

async function find ({ requester, thingId }, accessToken) {
  const tickets = await models.tickets.find(
    {
      requester,
      owner: accessToken.content.sub
    },
    { token: accessToken.token }
  )

  if (thingId !== undefined) {
    const regex = new RegExp(
      `(^${thingId}\/(properties|actions|events)\/.*)|^${thingId}$`
    )
    return tickets.filter(ticket => {
      return regex.test(ticket.resourceName)
    })
  }

  return tickets
}

async function insert (resource, requesterName, scope, accessToken) {
  const resources = await models.resource.find({
    name: resource,
    exactName: true
  })

  if (resources.length === 0) {
    throw new ThingNotFoundError()
  }

  const response = await models.tickets.insert({
    resource: resources[0],
    requesterName,
    scope,
    token: accessToken.token
  })

  if (!response.ok) {
    throw new InvalidTicket()
  }
}

async function remove (tickedId, accessToken) {
  const response = await models.tickets.delete(tickedId, {
    token: accessToken.token
  })

  if (!response.ok) {
    throw new TicketsNotFound()
  }
}

exports = module.exports = {
  find,
  insert,
  delete: remove
}
