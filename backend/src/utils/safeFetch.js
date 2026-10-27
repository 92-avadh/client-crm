const dns = require('dns').promises;
const net = require('net');

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, or metadata ranges.
 */
function isPrivateOrReservedIp(ip) {
  if (!net.isIP(ip)) return true;

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata: 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (parts[0] >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
    // :: (Unspecified)
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
    // fe80::/10 (Link-Local)
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
    // fc00::/7 (Unique Local)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (normalized.startsWith('::ffff:')) {
      const v4Part = normalized.replace('::ffff:', '');
      return isPrivateOrReservedIp(v4Part);
    }

    return false;
  }

  return true;
}

const ALLOWED_WEBHOOK_HOST_SUFFIXES = [
  'slack.com',
  'discord.com',
  'discordapp.com',
  'zapier.com',
  'make.com',
  'webhook.site',
];

/**
 * Validates a destination URL against SSRF attack vectors.
 * - Enforces HTTPS protocol
 * - Validates host against allowed domains (or prevents internal IP resolution)
 * - Resolves DNS and blocks loopback, private, and cloud metadata addresses
 */
async function validateUrlForSsrf(rawUrl, { allowedHostSuffixes = ALLOWED_WEBHOOK_HOST_SUFFIXES } = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Insecure protocol. Only HTTPS URLs are permitted.');
  }

  const hostname = parsed.hostname;
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Requests to localhost or local domains are prohibited.');
  }

  // If host suffixes allowlist is enforced:
  if (allowedHostSuffixes && allowedHostSuffixes.length > 0) {
    const isAllowedHost = allowedHostSuffixes.some(suffix =>
      hostname === suffix || hostname.endsWith('.' + suffix)
    );
    if (!isAllowedHost) {
      throw new Error(`Host '${hostname}' is not in the allowed webhook destinations list.`);
    }
  }

  // Resolve DNS to verify the target IP is not private or cloud metadata
  try {
    const lookupResults = await dns.lookup(hostname, { all: true });
    for (const record of lookupResults) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new Error('Destination resolves to a restricted or private network IP.');
      }
    }
  } catch (err) {
    if (err.message.includes('restricted or private')) throw err;
    throw new Error(`DNS resolution failed for host: ${hostname}`);
  }

  return parsed;
}

/**
 * Safe fetch wrapper that prevents SSRF.
 */
async function safeFetch(rawUrl, options = {}, config = {}) {
  await validateUrlForSsrf(rawUrl, config);

  const timeoutMs = options.timeout || 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(rawUrl, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  isPrivateOrReservedIp,
  validateUrlForSsrf,
  safeFetch,
};
