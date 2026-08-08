import "server-only";
import { prisma } from "./prisma";

export type NotificationType = "application_approved" | "application_rejected" | "request_fulfilled";

export async function notify(userId: string, type: NotificationType, title: string, body?: string, href?: string) {
  await prisma.notification.create({ data: { userId, type, title, body, href } });
}
