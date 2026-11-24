"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  conversationsApi,
  type ChatMessage,
  type ConversationDetail,
  type ConversationSummary,
} from "../lib/api";

const LIST_POLL_MS = 10_000;
const CHAT_POLL_MS = 4_000;

const formatVnd = (amount: number) => "₫" + new Intl.NumberFormat("vi-VN").format(amount);

const formatTime = (value: string) => {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Còn hàng",
  held: "Đang được giữ",
  sold: "Đã bán",
  upcoming_drop: "Sắp mở bán",
};

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  const src = avatar ? apiAssetUrl(avatar) : "";
  return (
    <div
      className="relative rounded-full bg-[#f2dfd1] text-[#974226] font-bold flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? <Image src={src} alt={name} fill className="object-cover" sizes={`${size}px`} /> : (name[0] ?? "?").toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const activeId = searchParams.get("c");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [detail, setDetail] = useState<ConversationDetail["conversation"] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn, router]);

  const loadList = useCallback(() => {
    conversationsApi
      .list()
      .then((res) => setConversations(res.data))
      .catch(() => undefined)
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadList();
    const timer = window.setInterval(loadList, LIST_POLL_MS);
    return () => window.clearInterval(timer);
  }, [isLoggedIn, loadList]);

  // Mở một cuộc trò chuyện: tải toàn bộ rồi thăm dò tin mới.
  useEffect(() => {
    if (!isLoggedIn || !activeId) return;

    let cancelled = false;
    lastTimeRef.current = undefined;
    // Đổi cuộc trò chuyện thì xoá nội dung cũ và bật cờ đang tải trước khi gọi API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatLoading(true);
    setError("");
    setMessages([]);
    setDetail(null);

    const fetchNew = async (initial: boolean) => {
      try {
        const res = await conversationsApi.messages(activeId, lastTimeRef.current);
        if (cancelled) return;
        setDetail(res.data.conversation);
        if (res.data.messages.length > 0) {
          lastTimeRef.current = res.data.messages[res.data.messages.length - 1].createdAt;
          setMessages((current) => {
            const known = new Set(current.map((message) => message.id));
            return [...current, ...res.data.messages.filter((message) => !known.has(message.id))];
          });
          if (!initial) loadList();
        }
      } catch (err) {
        if (!cancelled && initial) setError(err instanceof ApiError ? err.message : "Không mở được cuộc trò chuyện.");
      } finally {
        if (!cancelled && initial) setChatLoading(false);
      }
    };

    fetchNew(true).then(loadList);
    const timer = window.setInterval(() => fetchNew(false), CHAT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeId, isLoggedIn, loadList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeId || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await conversationsApi.send(activeId, body);
      setDraft("");
      lastTimeRef.current = res.data.createdAt;
      setMessages((current) => (current.some((message) => message.id === res.data.id) ? current : [...current, res.data]));
      loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const select = (id: string) => router.push(`/messages?c=${id}`);
  const product = detail?.product ?? null;
  const productImage = product?.images?.[0] ? apiAssetUrl(product.images[0]) : "";

  return (
    <div className="bg-[#fff8f5] text-[#231a11] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 pb-6">
        <div className="bg-white rounded-3xl border border-[#dbc1b9]/40 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-8rem)] min-h-[480px]">
          {/* Conversation list */}
          <aside className={`border-r border-[#f2dfd1] flex flex-col min-h-0 ${activeId ? "hidden md:flex" : "flex"}`}>
            <div className="px-5 py-4 border-b border-[#f2dfd1]">
              <h1 className="font-[family-name:var(--font-playfair)] text-xl font-bold">Tin nhắn</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <p className="p-5 text-sm text-[#88726c]">Đang tải...</p>
              ) : conversations.length === 0 ? (
                <p className="p-5 text-sm text-[#88726c]">
                  Chưa có cuộc trò chuyện nào. Mở một sản phẩm và bấm &quot;Nhắn tin cho shop&quot; để bắt đầu.
                </p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => select(conversation.id)}
                    className={`w-full text-left px-5 py-3.5 flex gap-3 border-b border-[#f2dfd1]/60 hover:bg-[#fff8f5] transition-colors ${
                      conversation.id === activeId ? "bg-[#feeadc]/60" : ""
                    }`}
                  >
                    <Avatar name={conversation.otherUser.name} avatar={conversation.otherUser.avatar} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{conversation.otherUser.name}</span>
                        <span className="text-[11px] text-[#88726c] shrink-0">{formatTime(conversation.lastMessageAt)}</span>
                      </div>
                      {conversation.product && <p className="text-[11px] text-[#974226] truncate">{conversation.product.title}</p>}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#55433d] truncate">
                          {conversation.lastMessage
                            ? `${conversation.lastMessage.senderId === user?.id ? "Bạn: " : ""}${conversation.lastMessage.body}`
                            : "Chưa có tin nhắn"}
                        </p>
                        {conversation.unread > 0 && (
                          <span className="bg-[#974226] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shrink-0">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat */}
          <section className={`flex-col min-h-0 ${activeId ? "flex" : "hidden md:flex"}`}>
            {!activeId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#88726c] p-8">
                <span className="material-symbols-outlined text-[56px] text-[#dbc1b9] mb-2">forum</span>
                <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu nhắn tin.</p>
              </div>
            ) : chatLoading && !detail ? (
              <p className="p-6 text-sm text-[#88726c]">Đang tải...</p>
            ) : !detail ? (
              <div className="p-6 text-sm text-[#ba1a1a]">{error || "Không tìm thấy cuộc trò chuyện."}</div>
            ) : (
              <>
                <header className="px-5 py-3.5 border-b border-[#f2dfd1] flex items-center gap-3">
                  <button className="md:hidden p-1 -ml-2 text-[#55433d]" onClick={() => router.push("/messages")} aria-label="Quay lại">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <Avatar name={detail.otherUser.name} avatar={detail.otherUser.avatar} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{detail.otherUser.name}</p>
                    <p className="text-[11px] text-[#88726c]">{detail.role === "buyer" ? "Người bán" : "Người mua"}</p>
                  </div>
                </header>

                {product && (
                  <div className="px-5 py-3 border-b border-[#f2dfd1] bg-[#fff8f5] flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#feeadc] shrink-0">
                      {productImage && <Image src={productImage} alt={product.title} fill className="object-cover" sizes="48px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{product.title}</p>
                      <p className="text-xs text-[#55433d]">
                        {formatVnd(product.price)} · {AVAILABILITY_LABEL[product.availabilityStatus] ?? product.availabilityStatus}
                      </p>
                    </div>
                    <Link href={`/products/${product.id}`} className="text-xs font-semibold text-[#974226] hover:underline shrink-0">
                      Xem sản phẩm
                    </Link>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-[#fffdfb]">
                  {messages.length === 0 && <p className="text-center text-xs text-[#88726c] py-6">Hãy gửi lời chào đầu tiên.</p>}
                  {messages.map((message) => {
                    const mine = message.senderId === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                            mine ? "bg-[#974226] text-white rounded-br-md" : "bg-[#f2dfd1]/70 text-[#231a11] rounded-bl-md"
                          }`}
                        >
                          {message.body}
                          <span className={`block text-[10px] mt-1 ${mine ? "text-white/70" : "text-[#88726c]"}`}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {error && <p className="px-5 py-2 text-xs text-[#ba1a1a] bg-[#ffdad6]">{error}</p>}

                <form onSubmit={send} className="px-4 py-3 border-t border-[#f2dfd1] flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={1000}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2.5 rounded-full border border-[#dbc1b9]/60 text-sm focus:outline-none focus:border-[#231a11]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#974226] text-white text-sm font-semibold hover:bg-[#b65a3c] disabled:opacity-50 transition-colors"
                  >
                    Gửi
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
      <MessagesContent />
    </Suspense>
  );
}
