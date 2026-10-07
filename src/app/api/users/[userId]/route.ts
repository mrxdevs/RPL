import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { User, UserRole, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";
import { SafeUser } from "../route";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin privileges required" },
      { status: 403 }
    );
  }

  const { userId } = await params;

  if (session.userId === userId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Cannot delete the currently authenticated administrator account" },
      { status: 400 }
    );
  }

  try {
    const users = await readJson<User[]>("users", []);
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const updatedUsers = users.filter((u) => u.id !== userId);
    await writeJson("users", updatedUsers);

    await logActivity({
      category: "team_update",
      title: "User Account Removed",
      description: `Account "${targetUser.username}" (${targetUser.role}) was deleted.`,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `User account "${targetUser.username}" removed successfully`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete user account";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin privileges required" },
      { status: 403 }
    );
  }

  const { userId } = await params;

  try {
    const body = await req.json();
    const users = await readJson<User[]>("users", []);
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    const currentUser = users[userIndex];
    const { role, displayName, password, teamId } = body;

    const updatedUser: User = {
      ...currentUser,
      role: role ? (role as UserRole) : currentUser.role,
      displayName: displayName ? String(displayName).trim() : currentUser.displayName,
      passwordHash: password ? String(password).trim() : currentUser.passwordHash,
      teamId: role === "captain" ? (teamId ? String(teamId) : currentUser.teamId) : undefined,
    };

    users[userIndex] = updatedUser;
    await writeJson("users", users);

    await logActivity({
      category: "team_update",
      title: "User Account Updated",
      description: `Account credentials/roles updated for "${updatedUser.username}".`,
    });

    const safeUser: SafeUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      displayName: updatedUser.displayName,
      teamId: updatedUser.teamId,
    };

    return NextResponse.json<ApiResponse<SafeUser>>({
      success: true,
      data: safeUser,
      message: `User ${updatedUser.username} updated successfully`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user account";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
