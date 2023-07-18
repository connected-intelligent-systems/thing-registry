"use strict";

const {
  createRemoteJWKSet,
  jwtVerify,
  jwtDecrypt,
  decodeJwt
} = require("jose");
const { KeycloakHost, KeycloakRealm } = require("../utils/keycloak");
const { InvalidOrMissingToken } = require("../utils/http_errors");

// const jwks = createRemoteJWKSet(
//   new URL(
//     `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/certs`
//   )
// );

function extractTokenFromHeader(req) {
  const [type, token] = req.headers.authorization?.split(" ") ?? [];
  return type === "Bearer" ? token : undefined;
}

exports = module.exports = async function(req, res, next) {
  const token = extractTokenFromHeader(req);
  if (!token) {
    return next(new InvalidOrMissingToken());
  }

  try {
    const decodedToken = await decodeJwt(token);
    // const decodedToken = await jwtVerify(token, jwks);

    req.auth = {
      access_token: {
        token,
        content: decodedToken
      }
    };

    next();
  } catch (e) {
    return next(new InvalidOrMissingToken());
  }
};
