"use strict";

const env = require("env-var");
const axios = require("axios");

const ThingsBoardUrl = env
  .get("THINGBOARD_API_URL")
  .default("http://192-168-178-60.nip.io")
  .asString();
const accessToken =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhbGJlcnRlcm5zdEBnbWFpbC5jb20iLCJ1c2VySWQiOiIyMjViZjEzMC0yNWEwLTExZWUtYmNlOS1jZGVhNGU0NTlmZmIiLCJzY29wZXMiOlsiVEVOQU5UX0FETUlOIl0sInNlc3Npb25JZCI6IjYwOGY0NzJkLWVmMGQtNGI0Yi04NzQ0LTY4MjRkMzBiMjkxMSIsImlzcyI6InRoaW5nc2JvYXJkLmlvIiwiaWF0IjoxNjg5Nzk5ODExLCJleHAiOjE2ODk4MDg4MTEsImZpcnN0TmFtZSI6IlNlYmFzdGlhbiIsImxhc3ROYW1lIjoiQWxiZXJ0ZXJuc3QiLCJlbmFibGVkIjpmYWxzZSwiaXNQdWJsaWMiOmZhbHNlLCJ0ZW5hbnRJZCI6ImYxZjVmNTQwLTI1OWYtMTFlZS1iY2U5LWNkZWE0ZTQ1OWZmYiIsImN1c3RvbWVySWQiOiIxMzgxNDAwMC0xZGQyLTExYjItODA4MC04MDgwODA4MDgwODAifQ.VY19iciVEI1jrXDr38hTf1pIJ1aP8AJIVEJGjcLFaT5i2BPfnraC_mxEnpQ6stbNUG0ixOa5MBt-HkiMoBr0eg";

async function getDevices({ page = 0, pageSize = 20 } = {}) {
  let devices = [];
  let hasNext = true;

  while (hasNext) {
    const result = await axios.get(
      `${ThingsBoardUrl}/api/tenant/devices?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    devices = devices.concat(result.data.data);
    hasNext = result.data.hasNext;
    page++;
  }

  return devices;
}

async function getAttributes(deviceId) {
  // GET /api/plugins/telemetry/{entityType}/{entityId}/values/attributes{?keys}
  const response = await axios.get(
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.data;
}

async function getAttributes(deviceId) {
  const response = await axios.get(
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.data;
}

async function getTimeseries(deviceId) {
  const response = await axios.get(
    `${ThingsBoardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.data;
}

// todo: implement
async function authenticate(accessToken) {
  const result = await axios.post(`${ThingsBoardUrl}/api/auth/login`, {
    user: "oauth2",
    password: accessToken
  });
}

exports = module.exports = {
  getDevices,
  getAttributes,
  getTimeseries
};
