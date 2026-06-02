"use strict";

// any other SDK/native error

export class TelecomAFError extends Error {
  /** The numeric AntiFraud error code when one could be parsed (e.g. 118, 119, 112). */

  constructor(kind, message, code) {
    super(message);
    this.name = 'TelecomAFError';
    this.kind = kind;
    this.code = code;
    Object.setPrototypeOf(this, TelecomAFError.prototype);
  }
}

/**
 * Maps a raw native rejection into a typed TelecomAFError. The native layer rejects with a
 * message that embeds the AntiFraud ErrorModel (code + message), so we parse the code and
 * classify the failure into a stable `kind`.
 */
export function toTelecomAFError(error) {
  if (error instanceof TelecomAFError) return error;
  const message = String(error?.message ?? error ?? 'Telecom AntiFraud error');
  const lower = message.toLowerCase();
  const codeMatch = message.match(/\b(\d{2,3})\b/);
  const code = codeMatch ? Number(codeMatch[1]) : undefined;
  let kind = 'SDK_ERROR';
  if (code === 118 || lower.includes('not active') || lower.includes('inactive')) {
    kind = 'ACCOUNT_INACTIVE';
  } else if (code === 119 || lower.includes('account not found') || lower.includes('application id not found')) {
    kind = 'ACCOUNT_NOT_FOUND';
  } else if (code === 112 || lower.includes('incorrect') || lower.includes("didn't match")) {
    kind = 'CODE_WRONG';
  } else if (code === 25 || lower.includes('blocked')) {
    kind = 'BLOCKED';
  }
  return new TelecomAFError(kind, message, code);
}

/** True when the error indicates the device account is inactive or missing (recoverable via re-init). */
export function isRecoverableAccountError(error) {
  const e = toTelecomAFError(error);
  return e.kind === 'ACCOUNT_INACTIVE' || e.kind === 'ACCOUNT_NOT_FOUND';
}
//# sourceMappingURL=errors.js.map