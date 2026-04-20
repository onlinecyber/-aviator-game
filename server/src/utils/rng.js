const crypto = require('crypto');

/**
 * Provably Fair Crash Point Generator
 * Uses HMAC-SHA256(serverSeed, clientSeed) to produce a verifiable crash point.
 * Formula is based on the standard industry algorithm used by BC.Game / Crash games.
 *
 * Players can verify: after a game, the serverSeed and clientSeed are revealed,
 * and anyone can run this function to confirm the crash point was fair.
 */
function generateCrashPoint(serverSeed, clientSeed) {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(clientSeed);
  const hash = hmac.digest('hex');

  // Use first 8 bytes of hash
  const h = parseInt(hash.slice(0, 8), 16);
  const e = Math.pow(2, 32); // 2^32

  // Formula produces a number ≥ 1.00
  // Distribution: ~50% chance of crash ≤ 2x, ~1% chance of ≥ 100x
  const raw = Math.floor((100 * e - h) / (e - h)) / 100;

  // Minimum crash point is 1.00 (instant crash is possible)
  return Math.max(1.0, raw);
}

/**
 * Generate a random hex seed
 */
function generateSeed(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Verify a past game's crash point (for provably fair UI)
 */
function verifyCrashPoint(serverSeed, clientSeed, claimedCrashPoint) {
  const computed = generateCrashPoint(serverSeed, clientSeed);
  return Math.abs(computed - claimedCrashPoint) < 0.01;
}

module.exports = { generateCrashPoint, generateSeed, verifyCrashPoint };
