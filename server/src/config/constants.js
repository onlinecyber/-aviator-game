// Game timing constants (all in milliseconds)
const BETTING_PHASE_MS = 7000;     // 7 seconds for betting
const CRASH_PHASE_MS = 3000;       // 3 seconds display after crash
const TICK_INTERVAL_MS = 100;      // Multiplier update every 100ms
const MAX_BET_AMOUNT = 100000;     // Max single bet
const MIN_BET_AMOUNT = 1;          // Min single bet
const MAX_CASHOUT_MULTIPLIER = 1000; // 1000x max cashout
const STARTING_BALANCE = process.env.STARTING_BALANCE || 1000;

module.exports = {
  BETTING_PHASE_MS,
  CRASH_PHASE_MS,
  TICK_INTERVAL_MS,
  MAX_BET_AMOUNT,
  MIN_BET_AMOUNT,
  MAX_CASHOUT_MULTIPLIER,
  STARTING_BALANCE,
};
