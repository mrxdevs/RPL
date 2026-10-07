import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/utils/jsonStore";
import { ActivityEvent, ApiResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  let activities = await readJson<ActivityEvent[]>("activity", []);

  if (matchId) {
    activities = activities.filter((a) => a.matchId === matchId);
  }

  return NextResponse.json<ApiResponse<ActivityEvent[]>>({
    success: true,
    data: activities.slice(0, limit),
  });
}
