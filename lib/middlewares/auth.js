'use strict'

const { createRemoteJWKSet, jwtVerify } = require('jose')
const { KeycloakHost, KeycloakRealm } = require('../utils/keycloak')

const jwks = createRemoteJWKSet(
  new URL(
    `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/certs`,
  ),
);

function extractTokenFromHeader(req) {
  const [type, token] = req.headers.authorization?.split(" ") ?? [];
  return type === "Bearer" ? token : undefined;
}

exports = module.exports = async function (req, res, next) {
  const token = extractTokenFromHeader(req);
  if (!token) {
    return next("shit");
  }

  try {
    const decodedToken = await jwtVerify(token, jwks)

    req.auth = {
      access_token: {
        token,
        content: decodedToken.payload
      }
    }

    console.log(req.auth)

    next()
  } catch (e) {
    return next(e);
  }
}
