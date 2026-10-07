import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/utils/auth";
import { ApiResponse, SessionData } from "@/lib/types";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: "Unauthenticated",
    });
  }

  return NextResponse.json<ApiResponse<SessionData>>({
    success: true,
    data: session,
  });
}
