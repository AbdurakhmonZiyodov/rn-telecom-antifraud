export interface TelecomAFConfig {
  /**
   * The Telecom AntiFraud agent host the SDK connects to, e.g. "https://my-biznes.uz".
   * This is participant-specific — ask your backend/operator for the correct value.
   */
  host: string;

  /**
   * SHA-256 public-key SSL pins in "sha256/<base64>" form (current + backup recommended).
   * When provided, pinning is enforced after initialize(). When empty/omitted, pinning is
   * NOT enforced. Obtain the pins from the operator (RTMC) — see the README "SSL pinning".
   */
  sslPins?: string[];

  /**
   * How many times to retry initialize() on failure (transient network at launch).
   * Default: 3.
   */
  initMaxAttempts?: number;
}

/**
 * Result of a verify-style SDK call. The SDK methods themselves resolve a status string;
 * the real fraud verdict is read by the backend (check-fraud) — the SDK only forwards the
 * device fingerprint / code to the AntiFraud system.
 */
export type TelecomAFNativeResult = string;
