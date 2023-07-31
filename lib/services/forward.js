'use strict'

const env = require('env-var')
const URL = require('url').URL
const HttpsProxyAgent = require('https-proxy-agent')
const HttpProxyAgent = require('http-proxy-agent')
const HttpProxy = require('http-proxy')
const { isEqual } = require('lodash')
const CredentialsStorage = require('../utils/credentials_storage')
const createHttpCredentials = require('../utils/create_http_credentials')
const { exchangeAccessToken } = require('../utils/keycloak')
const {
  InvalidAffordanceType,
  TargetNotFound,
  ProtocolNotImplemented,
  MethodNotAllowed,
  ServiceUnavailable,
  InvalidQueryParameters
} = require('../utils/http_errors')
const models = require('../models')

const ProxyTimeout = env
  .get('PROXY_TIMEOUT')
  .default(0)
  .asInt()
const IncomingTimeout = env
  .get('INCOMING_TIMEOUT')
  .default(0)
  .asInt()
const ProxyAddress = env.get('https_proxy').asString()
const httpsProxy = new HttpProxy({
  agent: ProxyAddress ? new HttpsProxyAgent(ProxyAddress) : undefined
})
const httpProxy = new HttpProxy({
  agent: ProxyAddress ? new HttpProxyAgent(ProxyAddress) : undefined
})

/**
 * Cleans up the header of the request.
 * @param {object} req - the request
 */
function cleanupHeaders (req) {
  delete req.headers['authorization']
  return req
}

/**
 * Checks if a protocol is secure
 * @param {string} protocol - Protocol to check
 */
function isSecureProtocol (protocol) {
  switch (protocol) {
    case 'https:':
    case 'wss:':
      return true
    default:
      return false
  }
}

/**
 * Builds the target url with query parameters
 */
function buildTargetUrl (href, queries = '') {
  const url = new URL(href)
  const encodedVariables = {
    ...Object.fromEntries(new URLSearchParams(url.search)),
    ...Object.fromEntries(new URLSearchParams(queries))
  }
  url.search = new URLSearchParams(encodedVariables).toString()
  return url.toString()
}

/**
 * Validates incoming request
 */
async function validatesHttpRequest (req, { target, query }) {
  if (target.http.method !== req.method) {
    throw new MethodNotAllowed()
  }

  // check for uri variables
  if (Object.keys(query).length > 0 && !target.uriVariables) {
    throw new InvalidQueryParameters()
  }

  for (const key of Object.keys(query)) {
    const uriVariable = target.uriVariables[key]
    if (uriVariable === undefined) {
      throw new InvalidQueryParameters()
    }

    const value = query[key]
    if (Array.isArray(value) && uriVariable.type !== 'array') {
      throw new InvalidQueryParameters()
    }

    if (uriVariable.const) {
      if (!isEqual(value, uriVariable.const)) {
        throw new InvalidQueryParameters()
      }
    }
  }
}

/**
 * Handles forwarding for http.
 */
async function handleHttp (req, res, next, { target, credentials, protocol }) {
  const proxy = isSecureProtocol(protocol) ? httpsProxy : httpProxy
  const result = createHttpCredentials(credentials, target)
  const targetUrl = buildTargetUrl(target.href, result.queries)
  return proxy.web(
    cleanupHeaders(req),
    res,
    {
      target: targetUrl,
      changeOrigin: true,
      ignorePath: true,
      ws: true,
      timeout: IncomingTimeout,
      proxyTimeout: ProxyTimeout,
      headers: result.headers
    },
    next
  )
}

/**
 * Handles forwarding for a websocket.
 */
async function handleWebsocket (
  req,
  socket,
  head,
  { target, credentials, protocol }
) {
  const proxy = isSecureProtocol(protocol) ? httpsProxy : httpProxy
  const result = createHttpCredentials(credentials, target)
  const targetUrl = buildTargetUrl(target.href, result.queries)
  return proxy.ws(req, socket, head, {
    target: targetUrl,
    changeOrigin: true,
    ignorePath: true,
    timeout: IncomingTimeout,
    proxyTimeout: ProxyTimeout,
    headers: result.headers
  })
}

/**
 * Validated for a correct affordance type
 */
function validateType (type) {
  switch (type) {
    case 'properties':
    case 'actions':
    case 'events':
      return true
  }
  return false
}

/**
 * Get the credentials for a specific target. If this target was created from a plugin
 * and the plugin supports authentication.
 */
async function getCredentials (id, target, accessToken) {
  if (target.source !== undefined && target.source !== null) {
    const plugin = await models.plugin.findOne(target.source)
    if (plugin !== undefined && plugin.supportsAuthentication() === true) {
      return plugin.module.authenticate(target, {
        credentialsStorage: new CredentialsStorage(target.source, target.owner),
        readSettings: async () => {
          const { settings } = await models.pluginSettings.findOne(
            target.source,
            target.owner
          )
          return settings
        },
        accessToken,
        exchangeAccessToken
      })
    }
  }
  return models.credentials.get(id)
}

/**
 * Checks if a target requires credentials
 */
function requiresCredentials (target) {
  return (
    Object.values(target.securityDefinitions)
      .map(sd => sd.scheme)
      .filter(schema => schema !== 'nosec').length > 0
  )
}

/**
 * Handles forwarding for exposed things. Currenlty only http forwarding is supported.
 */
async function forwardHttp (req, res, next) {
  const { id, name, index, type } = req.params
  if (validateType(type) === false) {
    throw new InvalidAffordanceType()
  }

  // check if the user who is sending the request is authorized
  const executable = await models.permissions.hasProxyPermissions({
    thingId: id,
    entityId: req.auth.access_token.content.sub,
    [type]: name
  })

  if (executable === false) {
    throw new TargetNotFound()
  }

  // get information of the target
  const target = await models.form.findOne({
    thingId: id,
    index,
    name,
    type
  })

  if (target === null) {
    throw new TargetNotFound()
  }

  // fetch all credentials for the current target
  const credentials = await getCredentials(id, target, req.auth.access_token)
  if (requiresCredentials(target) && credentials === undefined) {
    throw new ServiceUnavailable()
  }

  // forward requests
  const url = new URL(target.href)
  switch (url.protocol) {
    case 'https:':
    case 'http:':
      await validatesHttpRequest(req, { target, query: req.query })
      return handleHttp(req, res, next, {
        credentials,
        target,
        protocol: url.protocol
      })
    case 'ws:':
    case 'wss:':
      await validatesHttpRequest(req, { target, query: req.query })
      return handleWebsocket(req, req.socket, req.head, {
        credentials,
        target,
        protocol: url.protocol
      })
    default:
      throw new ProtocolNotImplemented(url.protocol.slice(0, -1))
  }
}

exports = module.exports = forwardHttp
