'use strict'

async function remove (req, res, next) {
  try {
    const tickets = await req.services.tickets.delete(
      req.params.id,
      req.auth.access_token
    )
    res.json(tickets)
  } catch (e) {
    next(e)
  }
}

exports = module.exports = {
  delete: remove
}
