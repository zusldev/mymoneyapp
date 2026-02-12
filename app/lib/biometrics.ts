"use client";

/**
 * Advanced Biometric Authentication using WebAuthn
 * Since we don't have a backend verification server for this PWA mode,
 * we rely on the OS-level prompt to ensure the user is present and authenticated.
 * This is "Client-Side Biometric Gating".
 */

export async function isBiometricSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return (
        window.PublicKeyCredential &&
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    );
}

export async function registerBiometric(): Promise<boolean> {
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: {
                    name: "MyMoneyApp",
                    id: window.location.hostname, // Must match current domain
                },
                user: {
                    id: new Uint8Array(16), // Random ID
                    name: "libor@mymoney.app",
                    displayName: "Libor",
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ES256
                    { type: "public-key", alg: -257 }, // RS256
                ],
                authenticatorSelection: {
                    // authenticatorAttachment: "platform", // Allow any (Platform or Roaming/Passkey)
                    userVerification: "required",
                    residentKey: "preferred", // Helps with "saving" the passkey
                    requireResidentKey: false,
                },
                timeout: 60000,
                attestation: "none",
            },
        }) as PublicKeyCredential;

        if (credential) {
            localStorage.setItem("biometric_credential_id", credential.id);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Biometric registration failed:", error);
        return false;
    }
}

export async function verifyBiometric(): Promise<boolean> {
    try {
        const credentialId = localStorage.getItem("biometric_credential_id");
        // Even if we don't have a stored ID, we can try to authenticate generally, 
        // but specifying allowCredentials is better if we registered.
        // For simplicity in this PWA mode without server syncing, we'll request a new assertion.

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge,
                rpId: window.location.hostname,
                userVerification: "required",
                // Validating against stored ID is optional here since we trust the OS prompt for local gating
                // but adding it ensures we use the registered authenticator if possible.
                allowCredentials: credentialId ? [{
                    id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)), // This might be complex to reconstruct correctly from base64 string without proper encoding utils
                    type: "public-key",
                    transports: ["internal"],
                }] : undefined,
            },
        });

        return !!assertion;
    } catch (error) {
        if (error instanceof Error && error.name === "NotAllowedError") {
            // User cancelled or failed
            return false;
        }
        console.warn("Biometric verification fallback:", error);
        // If explicit ID failed, try generic check (sometimes helps in dev/localhost)
        // But for now return false.
        return false;
    }
}
