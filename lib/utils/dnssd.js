'use strict'

const dnssd = require('dnssd')

/**
 * Sets up the DNS-SD (Domain Name System Service Discovery) for the thing registry.
 * @param {number} port - The port number to advertise the service on.
 */
function setupDnssd (port) {
  const mdnsAdvertisment = new dnssd.Advertisement(
    dnssd.tcp('thing-registry'),
    port
  )
  mdnsAdvertisment.start()
}

exports = module.exports = {
  setupDnssd
}
