import { NextResponse } from "next/server";
import { getSecurityStats, getSecurityLogs, SECURITY_EVENTS, RISK_LEVELS } from "@/lib/security/security-logger";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Check if requesting stats or logs
        const type = searchParams.get("type") || "stats";

        if (type === "stats") {
            const stats = await getSecurityStats();
            return NextResponse.json(stats);
        }

        // Get logs with filters
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const eventType = searchParams.get("eventType") || undefined;
        const riskLevel = searchParams.get("riskLevel") || undefined;
        const userId = searchParams.get("userId") || undefined;
        const ipAddress = searchParams.get("ipAddress") || undefined;
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;

        const logs = await getSecurityLogs({
            page,
            limit,
            eventType,
            riskLevel,
            userId,
            ipAddress,
            startDate,
            endDate,
        });

        return NextResponse.json({
            ...logs,
            eventTypes: Object.values(SECURITY_EVENTS),
            riskLevels: Object.values(RISK_LEVELS),
        });
    } catch (error) {
        console.error("[Security Logs API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch security logs" },
            { status: 500 }
        );
    }
}
