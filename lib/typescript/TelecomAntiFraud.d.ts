import type { TelecomAFConfig } from './types';
/**
 * Stores the participant host and (optional) SSL pins. Call once at app startup,
 * before any other TelecomAF method.
 */
declare function configure(cfg: TelecomAFConfig): void;
declare function isAvailable(): boolean;
declare function isConfigured(): boolean;
/**
 * Ensures the SDK is initialized per spec: skip when already initialized (isInitialized),
 * otherwise initialize once-per-install with retry. Call at app launch and right before
 * the registration/login OTP verify.
 */
declare function ensureInitialized(): Promise<boolean>;
declare function isInitialized(): Promise<boolean>;
/** Registration/login: verify the entered SMS code. Phone is normalized to 998XXXXXXXXX. */
declare function verifySmsCode(phone: string, code: string): Promise<void>;
/** Registration biometric step (backend `face/confirm/internal` is the usual variant). */
declare function confirmFace(birthDate: string, document: string): Promise<void>;
/** P2P: refresh the AntiFraud session before sending the OTP. Requires an ACTIVE account. */
declare function makeOperation(): Promise<void>;
/**
 * Like makeOperation(), but on a recoverable account error (118 inactive / 119 not found)
 * it forces a re-initialize and retries once. If it still fails, the account needs a full
 * registration (login + verifySmsCode + backend face/confirm) — the error is re-thrown.
 */
declare function makeOperationWithRecovery(): Promise<void>;
/** P2P: report the entered code and trigger the fraud check. */
declare function detectFraud(code: string): Promise<void>;
/**
 * Ends the AntiFraud session and clears the cached applicationId. Best-effort — a failure
 * here (e.g. "no account" on a never-registered device) is logged, not thrown.
 */
declare function logout(): Promise<void>;
/**
 * Returns the client-instance id (applicationId / device-binding id), cached after the first
 * successful fetch. On "Application Id not found" it re-initializes once and retries. Returns
 * null when the SDK is not ready or the id is unavailable (so the caller can skip the header).
 */
declare function getApplicationId(): Promise<string | null>;
/** Configure SSL pinning at runtime (e.g. certificate rotation). */
declare function setSslPinning(pins: string[]): Promise<void>;
/** Clear SSL pinning. */
declare function clearSslPinning(): Promise<void>;
/** Resets cached applicationId and the recovery guard (called by logout). */
declare function clearCache(): void;
export declare const TelecomAF: {
    configure: typeof configure;
    isAvailable: typeof isAvailable;
    isConfigured: typeof isConfigured;
    ensureInitialized: typeof ensureInitialized;
    isInitialized: typeof isInitialized;
    verifySmsCode: typeof verifySmsCode;
    confirmFace: typeof confirmFace;
    makeOperation: typeof makeOperation;
    makeOperationWithRecovery: typeof makeOperationWithRecovery;
    detectFraud: typeof detectFraud;
    logout: typeof logout;
    getApplicationId: typeof getApplicationId;
    setSslPinning: typeof setSslPinning;
    clearSslPinning: typeof clearSslPinning;
    clearCache: typeof clearCache;
};
export {};
//# sourceMappingURL=TelecomAntiFraud.d.ts.map