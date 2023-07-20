'use strict'

class HttpError extends Error {
  constructor (status, error, message, details) {
    super(message)
    this._error = error
    this._status = status
    this._details = details
  }

  get error () {
    return this._error
  }

  get status () {
    return this._status
  }

  get details () {
    return this._details
  }
}

class DescriptionNotFound extends HttpError {
  constructor () {
    super(404, 'description_not_found', 'Description not found')
  }
}

class AffordanceNotFound extends HttpError {
  constructor () {
    super(404, 'affordance_not_found', 'Affordance not found')
  }
}

class InvalidDescription extends HttpError {
  constructor (info) {
    super(400, 'description_invalid', 'Invalid Thing Description', info)
  }
}

class InvalidOrMissingScope extends HttpError {
  constructor () {
    super(401, 'invalid_scope', 'empty or missing scope')
  }
}

class PluginNotFound extends HttpError {
  constructor () {
    super(404, 'plugin_not_found', 'Plugin not found')
  }
}

class InvalidPluginSettings extends HttpError {
  constructor () {
    super(400, 'plugin_settings_invalid', 'Invalid plugin settings')
  }
}

class InvalidAffordanceType extends HttpError {
  constructor () {
    super(400, 'affordance_invalid', 'Invalid affordance type')
  }
}

class InsufficientPermissions extends HttpError {
  constructor () {
    super(403, 'permissions_insufficient', 'Insufficient permissions')
  }
}

class InvalidCredentials extends HttpError {
  constructor () {
    super(400, 'credentials_invalid', 'Invalid credentials')
  }
}

class InternalServerError extends HttpError {
  constructor () {
    super(500, 'unknown', 'Internal server error')
  }
}

class ThingNotFoundError extends HttpError {
  constructor () {
    super(404, 'thing_not_found', 'Thing not found')
  }
}

class TargetNotFound extends HttpError {
  constructor () {
    super(404, 'target_not_found', 'Target not found')
  }
}

class TargetNotAuthorized extends HttpError {
  constructor () {
    super(403, 'target_not_authorized', 'Target not authorized')
  }
}

class InvalidTicket extends HttpError {
  constructor () {
    super(400, 'ticket_invalid', 'Invalid Ticket')
  }
}

class TicketsNotFound extends HttpError {
  constructor () {
    super(404, 'tickets_not_found', 'No tickets found')
  }
}

class TicketRequestAlreadyExists extends HttpError {
  constructor () {
    super(
      409,
      'ticket_requester_already_exists',
      'Ticket requester already exists'
    )
  }
}

class ProtocolNotImplemented extends HttpError {
  constructor (protocol) {
    super(
      501,
      'protocol_not_implemented',
      `${protocol} protocol not implemented`
    )
  }
}

class InvalidOrMissingToken extends HttpError {
  constructor () {
    super(401, 'invalid_token', 'invalid or missing token')
  }
}

class ThingAlreadyExists extends HttpError {
  constructor () {
    super(409, 'thing_already_exists', 'Thing ID already exists')
  }
}

class TargetNotAvailable extends HttpError {
  constructor () {
    super(404, 'target_not_available', 'Target not available')
  }
}

class MethodNotAllowed extends HttpError {
  constructor () {
    super(405, 'method_not_allowed', 'Method not allowed')
  }
}

class SecurityMechanismNotImplemented extends HttpError {
  constructor (securityMechanism) {
    super(
      501,
      'security_mechanism_not_implemented',
      `The security mechanism '${securityMechanism}' is not implemented`
    )
  }
}

class PermissionNotFound extends HttpError {
  constructor () {
    super(404, 'permission_not_found', 'Permission not found')
  }
}

exports = module.exports = {
  HttpError,
  DescriptionNotFound,
  AffordanceNotFound,
  InvalidOrMissingScope,
  InvalidDescription,
  PluginNotFound,
  InvalidPluginSettings,
  InvalidAffordanceType,
  InsufficientPermissions,
  InvalidCredentials,
  InternalServerError,
  ThingNotFoundError,
  TargetNotFound,
  TargetNotAuthorized,
  InvalidTicket,
  TicketsNotFound,
  TicketRequestAlreadyExists,
  ProtocolNotImplemented,
  InvalidOrMissingToken,
  ThingAlreadyExists,
  TargetNotAvailable,
  MethodNotAllowed,
  SecurityMechanismNotImplemented,
  PermissionNotFound
}
