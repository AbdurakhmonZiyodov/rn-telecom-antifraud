export type TelecomAFErrorKind =
  | 'NOT_CONFIGURED' // configure() was not called before using the SDK
  | 'UNAVAILABLE' // native module not linked / not rebuilt
  | 'NOT_INITIALIZED' // SDK not initialized yet
  | 'ACCOUNT_INACTIVE' // AF code 118 — account is not active (needs full registration)
  | 'ACCOUNT_NOT_FOUND' // AF code 119 / "Application Id not found"
  | 'CODE_WRONG' // AF code 112 — incorrect verification code
  | 'BLOCKED' // AF code 25 — account blocked after wrong attempts
  | 'SDK_ERROR'; // any other SDK/native error

export class TelecomAFError extends Error {
  readonly kind: TelecomAFErrorKind;
  /** The numeric AntiFraud error code when one could be parsed (e.g. 118, 119, 112). */
  readonly code?: number;

  constructor(kind: TelecomAFErrorKind, message: string, code?: number) {
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
export function toTelecomAFError(error: unknown): TelecomAFError {
  if (error instanceof TelecomAFError) return error;

  const message = String((error as Error)?.message ?? error ?? 'Telecom AntiFraud error');
  const lower = message.toLowerCase();

  const codeMatch = message.match(/\b(\d{2,3})\b/);
  const code = codeMatch ? Number(codeMatch[1]) : undefined;

  let kind: TelecomAFErrorKind = 'SDK_ERROR';
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
export function isRecoverableAccountError(error: unknown): boolean {
  const e = toTelecomAFError(error);
  return e.kind === 'ACCOUNT_INACTIVE' || e.kind === 'ACCOUNT_NOT_FOUND';
}
