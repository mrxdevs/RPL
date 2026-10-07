import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";
import { SESSION_COOKIE_NAME } from "@/lib/utils/auth";

export async function POST() {
  const response = NextResponse.json<ApiResponse>({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
