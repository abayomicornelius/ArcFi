"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

function relativeTime(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  function load() {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: { notifications: Notification[]; unreadCount: number }) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [status]);

  function handleOpen() {
    if (status !== "authenticated") {
      toast.info("Sign in with GitHub to see notifications", {
        action: { label: "Sign in", onClick: () => signIn("github") },
      });
      return;
    }
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      fetch("/api/notifications/read-all", { method: "POST" }).then(() => setUnreadCount(0));
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition ${
          dark ? "border-white/15 text-white/70 hover:bg-white/5 hover:text-white" : "border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && status === "authenticated" && (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-3.5 py-2.5">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-ink-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications === null ? (
              <p className="px-3.5 py-6 text-center text-sm text-ink-400">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-sm text-ink-400">Nothing yet.</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <>
                    <p className="flex items-start gap-1.5 text-sm font-medium text-ink-900">
                      {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <span>{n.title}</span>
                    </p>
                    {n.body && <p className="mt-0.5 text-xs text-ink-500">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-ink-400">{relativeTime(n.createdAt)}</p>
                  </>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block border-b border-ink-100 px-3.5 py-3 last:border-b-0 hover:bg-ink-50">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className="border-b border-ink-100 px-3.5 py-3 last:border-b-0">
                    {content}
                  </div>
                );
              })
            )}
          </div>

          {notifications && notifications.length > 0 && (
            <div className="flex items-center gap-1.5 border-t border-ink-100 px-3.5 py-2 text-xs text-ink-400">
              <Check className="h-3 w-3" /> Marked as read
            </div>
          )}
        </div>
      )}
    </div>
  );
}
