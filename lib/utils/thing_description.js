"use strict";

const { AffordanceType } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");

function convertAffordanceType(type) {
  switch (type) {
    case "properties":
      return AffordanceType.property;
    case "events":
      return AffordanceType.event;
    case "actions":
      return AffordanceType.action;
  }
}

function findAffordancesForType(thing, type, { source, owner } = {}) {
  return Object.keys(thing[type] || {}).map(key => ({
    description: thing[type][key],
    type: convertAffordanceType(type),
    types: thing[type][key]["@type"] ?? [],
    name: key,
    source,
    owner,
    id: `${thing.id}/${type}/${key}`
  }));
}

function findAffordances(thing, options) {
  return [
    ...findAffordancesForType(thing, "properties", options),
    ...findAffordancesForType(thing, "events", options),
    ...findAffordancesForType(thing, "actions", options)
  ];
}

function findTargetsForType(thing, type, { source, owner } = {}) {
  return Object.keys(thing[type] || {})
    .map(key =>
      thing[type][key].forms.map((target, index) => ({
        index,
        name: key,
        description: target,
        type: convertAffordanceType(type),
        source,
        owner
      }))
    )
    .flat();
}

function findTargets(thing, options) {
  return [
    ...findTargetsForType(thing, "properties", options),
    ...findTargetsForType(thing, "events", options),
    ...findTargetsForType(thing, "actions", options)
  ];
}

function generateThingId() {
  return `uri:urn:${uuidv4()}`;
}

exports = module.exports = {
  findAffordances,
  findTargets,
  generateThingId
};
