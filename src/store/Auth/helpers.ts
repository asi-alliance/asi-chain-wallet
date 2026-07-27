import { IWalletMeta } from "types/wallet";
import { AuthState } from ".";
import {
    detectSuspiciousFlags,
    FailureReason,
    LoginAttemptStatus,
    LoginType,
    recordLoginAttempt,
    SuspiciousFlag,
} from "services/loginAuditLog";
import { recordFailedAttempt, resetRateLimit } from "services/loginRateLimit";

export const setActiveSession = (
    state: AuthState,
    wallet: IWalletMeta,
): void => {
    const now = Date.now();

    state.activeWalletId = wallet.id ?? null;
    state.activeSignerId = wallet.signerId;
    state.status = "unlocked";
    state.unlockedAt = now;
    state.lastActivity = now;
    state.isAuthenticated = true;
};

export const clearActiveSession = (state: AuthState): void => {
    state.activeWalletId = null;
    state.activeSignerId = null;
    state.status = "locked";
    state.unlockedAt = null;
    state.isAuthenticated = false;
};

export function classifyLoginError(err: unknown): FailureReason {
    if (err instanceof DOMException) {
        if (err.name === "AbortError") return FailureReason.Cancelled;
        if (err.name === "TimeoutError") return FailureReason.Timeout;
    }
    if (err instanceof TypeError) {
        const message = err.message.toLowerCase();
        if (
            message.includes("network") ||
            message.includes("failed to fetch")
        ) {
            return FailureReason.NetworkError;
        }
    }
    return FailureReason.Unknown;
}

export function isCredentialFailure(reason: FailureReason): boolean {
    return (
        reason === FailureReason.WrongPassword ||
        reason === FailureReason.NoAccount
    );
}

export async function handleLoginOutcome(
    succeeded: boolean,
    contextKey: string,
    failureReason: FailureReason | undefined,
    accountName: string | undefined,
    loginType: LoginType,
): Promise<void> {
    if (succeeded) {
        await resetRateLimit(contextKey);
        await recordLoginAttempt(
            LoginAttemptStatus.Success,
            accountName,
            loginType,
        );
        return;
    }

    const reason = failureReason ?? FailureReason.Unknown;

    // Detect suspicious patterns before writing the entry
    const flags = isCredentialFailure(reason)
        ? await detectSuspiciousFlags(accountName)
        : undefined;

    // Increment rate-limit counter for credential failures only
    let justLocked = false;
    if (isCredentialFailure(reason)) {
        const rateLimitResult = await recordFailedAttempt(contextKey);
        justLocked = rateLimitResult.locked;
    }

    // Record the failure with any suspicious flags attached
    await recordLoginAttempt(
        LoginAttemptStatus.Failure,
        accountName,
        loginType,
        reason,
        flags,
    );

    // If this failure triggered the lockout, record a separate AccountLocked event
    if (justLocked) {
        await recordLoginAttempt(
            LoginAttemptStatus.AccountLocked,
            accountName,
            loginType,
            FailureReason.RateLimited,
            [SuspiciousFlag.RateLimitTriggered],
        );
    }
}
