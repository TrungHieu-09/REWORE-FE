"use client";

import { useEffect, useState } from "react";
import { conversationsApi } from "../lib/api";

// Số tin nhắn chưa đọc, cập nhật mỗi 30 giây khi đã đăng nhập.
export function useUnreadMessages(enabled: boolean) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const load = () =>
      conversationsApi
        .unreadCount()
        .then((res) => {
          if (!cancelled) setUnread(res.data.unread);
        })
        .catch(() => undefined);

    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled]);

  return enabled ? unread : 0;
}
