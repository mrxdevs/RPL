import { readJson, writeJson } from "./jsonStore";
import { ActivityEvent } from "../types";

export async function logActivity(
  event: Omit<ActivityEvent, "id" | "timestamp">
): Promise<ActivityEvent> {
  const currentLogs = await readJson<ActivityEvent[]>("activity", []);

  const newEvent: ActivityEvent = {
    ...event,
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const updatedLogs = [newEvent, ...currentLogs].slice(0, 100);

  try {
    await writeJson("activity", updatedLogs);
  } catch {
    // If running on read-only deployment, fail gracefully
  }

  return newEvent;
}
