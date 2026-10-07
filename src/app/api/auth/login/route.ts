import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/utils/jsonStore";
import { User, ApiResponse } from "@/lib/types";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const users = await readJson<User[]>("users", []);
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!user || user.passwordHash !== password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        teamId: user.teamId,
      },
      message: "Authentication successful",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}
