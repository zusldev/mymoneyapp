"use client";

/**
 * Advanced Biometric Authentication using WebAuthn (FaceID/TouchID)
 * 
 * Since we don't have a backend verification server for this PWA mode,
 * we rely on the OS-level prompt to ensure the user is present and authenticated.
 * This is "Client-Side Biometric Gating".
 */

// Helper for proper buffer conversion
function bufferToUrlBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function urlBase64ToUint8Array(base64url: string): Uint8Array {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export async function isBiometricSupported(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
        return false;
    }
}

export async function registerBiometric(): Promise<boolean> {
    if (!(await isBiometricSupported())) return false;

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userID = new Uint8Array(16);
        window.crypto.getRandomValues(userID);

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: { name: "MyMoneyApp", id: window.location.hostname },
            user: {
                id: userID,
                name: "user@mymoneyapp.com",
                displayName: "Usuario",
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
            },
            timeout: 60000,
        };

        const credential = (await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        })) as PublicKeyCredential;

        if (credential) {
            const credentialId = bufferToUrlBase64(credential.rawId);
            localStorage.setItem("biometric_credential_id", credentialId);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error registering biometrics:", error);
        return false;
    }
}

export async function verifyBiometric(): Promise<boolean> {
    const storedId = localStorage.getItem("biometric_credential_id");
    if (!storedId) {
        console.warn("No biometric credential stored");
        return false;
    }

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const idBytes = urlBase64ToUint8Array(storedId);

        const credential = (await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [{ id: idBytes, type: "public-key" }],
                userVerification: "required",
                timeout: 60000,
            },
        })) as PublicKeyCredential;

        return !!credential;
    } catch (error: any) {
        if (error.name === "NotAllowedError") {
            console.log("User cancelled biometric prompt");
        } else {
            console.error("Biometric verification failed:", error);
        }
        return false;
    }
}
