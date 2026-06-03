"use strict";

import { NativeModules, Platform } from 'react-native';
import NativeTelecomAntiFraud from './NativeTelecomAntiFraud';
import { TelecomAFError, toTelecomAFError, isRecoverableAccountError } from './errors';
const LINKING_ERROR = `The package 'rn-telecom-antifraud' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package (native change — JS reload is not enough)\n' + '- You are not using Expo Go\n';
let config = null;

// applicationId is stable per install — cache it after the first successful fetch.
let cachedApplicationId = null;
// One-shot guard so the "Application Id not found" recovery re-init is attempted at most
// once per session (getApplicationId runs on every request — must not hammer initialize).
let recoveryAttempted = false;

// SDK markers that must NOT be cached as a valid id (also trigger a re-init recovery).
const INVALID_ID_MARKERS = ['not found', 'not_found'];
function getNative() {
  const mod = NativeTelecomAntiFraud ?? NativeModules.RNTelecomAntiFraud;
  if (!mod) {
    throw new TelecomAFError('UNAVAILABLE', LINKING_ERROR);
  }
  return mod;
}
function requireConfig() {
  if (!config) {
    throw new TelecomAFError('NOT_CONFIGURED', 'TelecomAF.configure() must be called before using the SDK');
  }
  return config;
}
function isValidId(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return !INVALID_ID_MARKERS.some(marker => lower.includes(marker));
}

/** Normalizes any phone form to the spec format: 12 digits, no "+", e.g. 998901234567. */
function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) return `998${digits}`;
  return digits;
}

/**
 * Stores the participant host and (optional) SSL pins. Call once at app startup,
 * before any other TelecomAF method.
 */
function configure(cfg) {
  if (!cfg?.host) {
    throw new TelecomAFError('NOT_CONFIGURED', 'TelecomAF.configure requires a non-empty host');
  }
  config = {
    host: cfg.host,
    sslPins: cfg.sslPins ?? [],
    initMaxAttempts: cfg.initMaxAttempts && cfg.initMaxAttempts > 0 ? cfg.initMaxAttempts : 3
  };
}
function isAvailable() {
  return (NativeTelecomAntiFraud ?? NativeModules.RNTelecomAntiFraud) != null;
}
function isConfigured() {
  return config !== null;
}

/**
 * Runs initialize() (NO isInitialized guard) with a retry loop, then applies SSL pinning
 * when pins are configured. Used both for first init and for recovery re-init.
 */
async function runInitialize() {
  const cfg = requireConfig();
  const native = getNative();
  for (let attempt = 1; attempt <= cfg.initMaxAttempts; attempt++) {
    try {
      // SSL pins must be applied BEFORE the SDK builds its network client — we pass them into
      // initialize() (native applies setSslPinning before initialization). Setting pins after
      // init does NOT enforce pinning.
      await native.initialize(cfg.host, cfg.sslPins);
      return true;
    } catch (error) {
      console.log(`[TelecomAF] initialize attempt ${attempt}/${cfg.initMaxAttempts} failed:`, error);
    }
  }
  return false;
}

/**
 * Ensures the SDK is initialized per spec: skip when already initialized (isInitialized),
 * otherwise initialize once-per-install with retry. Call at app launch and right before
 * the registration/login OTP verify.
 */
async function ensureInitialized() {
  requireConfig();
  const native = getNative();
  try {
    if (await native.isInitialized()) return true;
  } catch {
    // isInitialized unavailable — fall through and try to initialize anyway.
  }
  return runInitialize();
}
async function isInitialized() {
  try {
    return await getNative().isInitialized();
  } catch {
    return false;
  }
}

/** Registration/login: verify the entered SMS code. Phone is normalized to 998XXXXXXXXX. */
async function verifySmsCode(phone, code) {
  try {
    await getNative().verifySmsCode(normalizePhone(phone), code);
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/** Registration biometric step (backend `face/confirm/internal` is the usual variant). */
async function confirmFace(birthDate, document) {
  try {
    await getNative().confirmFace(birthDate, document);
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/** P2P: refresh the AntiFraud session before sending the OTP. Requires an ACTIVE account. */
async function makeOperation() {
  try {
    await getNative().makeOperation();
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/**
 * Like makeOperation(), but on a recoverable account error (118 inactive / 119 not found)
 * it forces a re-initialize and retries once. If it still fails, the account needs a full
 * registration (login + verifySmsCode + backend face/confirm) — the error is re-thrown.
 */
async function makeOperationWithRecovery() {
  const native = getNative();
  try {
    await native.makeOperation();
    return;
  } catch (error) {
    if (!isRecoverableAccountError(error)) {
      throw toTelecomAFError(error);
    }
    clearCache();
    await runInitialize();
    try {
      await native.makeOperation();
    } catch (retryError) {
      throw toTelecomAFError(retryError);
    }
  }
}

/** P2P: report the entered code and trigger the fraud check. */
async function detectFraud(code) {
  try {
    await getNative().detectFraud(code);
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/**
 * Ends the AntiFraud session and clears the cached applicationId. Best-effort — a failure
 * here (e.g. "no account" on a never-registered device) is logged, not thrown.
 */
async function logout() {
  try {
    await getNative().logout();
  } catch (error) {
    console.log('[TelecomAF] logout error (ignored):', error);
  } finally {
    clearCache();
  }
}

/**
 * Returns the client-instance id (applicationId / device-binding id), cached after the first
 * successful fetch. On "Application Id not found" it re-initializes once and retries. Returns
 * null when the SDK is not ready or the id is unavailable (so the caller can skip the header).
 */
async function getApplicationId() {
  if (cachedApplicationId) return cachedApplicationId;
  const native = getNative();
  try {
    if (!(await native.isInitialized())) return null;
    const id = await native.getApplicationId();
    if (isValidId(id)) {
      cachedApplicationId = id;
      return cachedApplicationId;
    }
    if (!recoveryAttempted) {
      recoveryAttempted = true;
      if (await runInitialize()) {
        const retryId = await native.getApplicationId();
        if (isValidId(retryId)) {
          cachedApplicationId = retryId;
          return cachedApplicationId;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Configure SSL pinning at runtime (e.g. certificate rotation). */
async function setSslPinning(pins) {
  try {
    await getNative().setSslPinning(pins);
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/** Clear SSL pinning. */
async function clearSslPinning() {
  try {
    await getNative().clearSslPinning();
  } catch (error) {
    throw toTelecomAFError(error);
  }
}

/** Resets cached applicationId and the recovery guard (called by logout). */
function clearCache() {
  cachedApplicationId = null;
  recoveryAttempted = false;
}
export const TelecomAF = {
  configure,
  isAvailable,
  isConfigured,
  ensureInitialized,
  isInitialized,
  verifySmsCode,
  confirmFace,
  makeOperation,
  makeOperationWithRecovery,
  detectFraud,
  logout,
  getApplicationId,
  setSslPinning,
  clearSslPinning,
  clearCache
};
//# sourceMappingURL=TelecomAntiFraud.js.map