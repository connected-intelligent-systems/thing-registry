"use strict";

const { decodeToken } = require("../utils/keycloak");
const { InvalidOrMissingToken } = require("../utils/http_errors");

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
    const decodedToken = await decodeToken(token);

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
