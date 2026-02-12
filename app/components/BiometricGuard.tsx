"use client";

import { useState, useEffect } from "react";

export function BiometricGuard({ children }: { children: React.ReactNode }) {
    // Middleware now handles redirecting to /unlock if no session exists.
    // This component remains only to maintain layout compatibility if needed,
    // or specifically protect certain UI interactions.
    return <>{children}</>;
}
