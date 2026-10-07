import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { User, UserRole, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export type SafeUser = Omit<User, "passwordHash">;

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin privileges required" },
      { status: 403 }
    );
  }

  const users = await readJson<User[]>("users", []);
  const safeUsers: SafeUser[] = users.map(({ id, username, role, displayName, teamId }) => ({
    id,
    username,
    role,
    displayName,
    teamId,
  }));

  return NextResponse.json<ApiResponse<SafeUser[]>>({
    success: true,
    data: safeUsers,
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin privileges required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { username, password, role, displayName, teamId } = body;

    if (!username || !password || !role || !displayName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username, password, role, and display name are required" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Username must be at least 3 characters long" },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ["admin", "captain", "umpire", "user"];
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const users = await readJson<User[]>("users", []);
    const existing = users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Username "${cleanUsername}" is already taken` },
        { status: 409 }
      );
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      passwordHash: String(password).trim(),
      role: role as UserRole,
      displayName: String(displayName).trim(),
      teamId: role === "captain" && teamId ? String(teamId) : undefined,
    };

    const updatedUsers = [...users, newUser];
    await writeJson("users", updatedUsers);

    await logActivity({
      category: "team_update",
      title: "User Account Created",
      description: `New ${newUser.role.toUpperCase()} account created for "${newUser.username}" (${newUser.displayName}).`,
    });

    const safeUser: SafeUser = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      displayName: newUser.displayName,
      teamId: newUser.teamId,
    };

    return NextResponse.json<ApiResponse<SafeUser>>({
      success: true,
      data: safeUser,
      message: `User ${newUser.username} created successfully with ${newUser.role} privileges`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create user account";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
