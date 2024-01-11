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

class MissingTenantIdHeader extends HttpError {
  constructor () {
    super(400, 'tenant_id_header_missing', 'Missing Tenant Id Header')
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

class PluginSettingsNotFound extends HttpError {
  constructor () {
    super(404, 'plugin_settings_not_found', 'Plugin settings not found')
  }
}

class InvalidPluginSettings extends HttpError {
  constructor () {
    super(400, 'plugin_settings_invalid', 'Invalid plugin settings')
  }
}

class PluginSettingsMissing extends HttpError {
  constructor () {
    super(422, 'plugin_settings_missing', 'Plugin settings missing')
  }
}

class InvalidAffordanceType extends HttpError {
  constructor () {
    super(400, 'affordance_invalid', 'Invalid affordance type')
  }
}

class UnknownEntityName extends HttpError {
  constructor () {
    super(400, 'unknown_entity_name', 'Unknown entity name')
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

class ThingNotFound extends HttpError {
  constructor () {
    super(404, 'thing_not_found', 'Thing not found')
  }
}

class TargetNotFound extends HttpError {
  constructor () {
    super(404, 'target_not_found', 'Target not found')
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

class DiscoveryScanFailed extends HttpError {
  constructor (pluginName, details) {
    super(
      501,
      'discovery_scan_failed',
      `Discovery scan for '${pluginName}' failed`,
      details
    )
  }
}

class ServiceUnavailable extends HttpError {
  constructor () {
    super(503, 'service_unavailable', 'Service unavailable')
  }
}

class InvalidQueryParameters extends HttpError {
  constructor () {
    super(400, 'invalid_query_parameters', 'Invalid query parameters')
  }
}

class FusekiSyncFailed extends HttpError {
  constructor (code, details) {
    super(
      code,
      'fuseki_sync_failed',
      'Synchronization with Fuseki failed',
      details
    )
  }
}

class JSONLdValidationFailed extends HttpError {
  constructor (details) {
    super(400, 'jsonld_validation_failed', 'JSONLd validation failed', details)
  }
}

exports = module.exports = {
  HttpError,
  DescriptionNotFound,
  AffordanceNotFound,
  MissingTenantIdHeader,
  InvalidOrMissingScope,
  InvalidDescription,
  PluginNotFound,
  PluginSettingsNotFound,
  PluginSettingsMissing,
  InvalidPluginSettings,
  InvalidAffordanceType,
  InsufficientPermissions,
  InvalidCredentials,
  InternalServerError,
  ThingNotFound,
  TargetNotFound,
  InvalidTicket,
  TicketsNotFound,
  ProtocolNotImplemented,
  InvalidOrMissingToken,
  ThingAlreadyExists,
  TargetNotAvailable,
  MethodNotAllowed,
  SecurityMechanismNotImplemented,
  ServiceUnavailable,
  UnknownEntityName,
  DiscoveryScanFailed,
  InvalidQueryParameters,
  FusekiSyncFailed,
  JSONLdValidationFailed
}
