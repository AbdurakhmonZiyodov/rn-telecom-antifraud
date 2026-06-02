export type TelecomAFErrorKind = 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'NOT_INITIALIZED' | 'ACCOUNT_INACTIVE' | 'ACCOUNT_NOT_FOUND' | 'CODE_WRONG' | 'BLOCKED' | 'SDK_ERROR';
export declare class TelecomAFError extends Error {
    readonly kind: TelecomAFErrorKind;
    /** The numeric AntiFraud error code when one could be parsed (e.g. 118, 119, 112). */
    readonly code?: number;
    constructor(kind: TelecomAFErrorKind, message: string, code?: number);
}
/**
 * Maps a raw native rejection into a typed TelecomAFError. The native layer rejects with a
 * message that embeds the AntiFraud ErrorModel (code + message), so we parse the code and
 * classify the failure into a stable `kind`.
 */
export declare function toTelecomAFError(error: unknown): TelecomAFError;
/** True when the error indicates the device account is inactive or missing (recoverable via re-init). */
export declare function isRecoverableAccountError(error: unknown): boolean;
//# sourceMappingURL=errors.d.ts.map