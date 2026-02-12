import { NextRequest, NextResponse } from "next/server";

// In a real production environment with Prisma, we would do:
// await prisma.config.upsert({ where: { key: 'app_pin' }, update: { value: hashedPin }, create: { key: 'app_pin', value: hashedPin } })
// For this standalone PWA demo, we'll use a global variable (memory) or another mock strategy.
// However, since Next.js routes are serverless, we'll simulate persistence by using a simple 
// in-memory mock or assuming the environment variable is the source of truth for now.
// TO EFFECTIVELY MOCK IT FOR THIS UI TASK:

let MOCKED_PIN = process.env.APP_PASSCODE || "1234";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { pincode } = body;

        if (!pincode || pincode.length !== 4) {
            return NextResponse.json({ error: "PIN inválido" }, { status: 400 });
        }

        // Simulating persistence
        MOCKED_PIN = pincode;
        console.log(`[AUTH] PIN updated to: ${pincode} (Simulated)`);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Error al guardar PIN" }, { status: 500 });
    }
}

// Export the getter so unlock can use it if they share the same module lifecycle
export function getAppPin() {
    return MOCKED_PIN;
}
