import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { apiJson } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { ChatDto } from "../types";

export function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatDto[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const data = await apiJson<ChatDto[]>("/api/chat");
    setMessages(data);
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    await apiJson("/api/chat", { method: "POST", body: JSON.stringify({ text }) });
    setText("");
    await load();
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Team chat</div>
          <div className="text-xs text-slate-500">Messages sync every few seconds</div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <div className="py-10 text-center text-sm text-slate-500">No messages yet</div>}
          {messages.map((m, i) => {
            const isMe = m.userId === user?.id;
            const showName = i === 0 || messages[i - 1].userId !== m.userId;
            return (
              <div key={m.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="mt-5 h-8 w-8 flex-shrink-0 rounded-full bg-slate-200 text-center text-[10px] font-bold leading-8 text-slate-700">
                    {showName ? m.initials : ""}
                  </div>
                )}
                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isMe && showName && <div className="mb-1 text-xs font-medium text-slate-500">{m.userName}</div>}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isMe ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className={`mt-1 text-[11px] text-slate-400 ${isMe ? "text-right" : ""}`}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-slate-200 p-3">
          <div className="flex gap-2">
            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" className="btn-primary px-4" onClick={() => void send()}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
