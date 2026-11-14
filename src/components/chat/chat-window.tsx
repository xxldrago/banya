"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Attachment = {
  id: string;
  url: string;
  type: string;
  name?: string | null;
};

type Message = {
  id: string;
  body: string;
  senderId: string;
  sender?: {
    id: string;
    name: string | null;
    email: string;
  };
  attachments?: Attachment[];
  createdAt: string;
};

type Template = { id: string; name: string; body: string };

type ChatWindowProps = {
  conversationId: string;
  currentUserId: string;
  token: string;
  role?: string;
};

export function ChatWindow({ conversationId, currentUserId, token, role }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [uploading, setUploading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // load existing messages
    fetch(`/api/v1/chat/conversations/${conversationId}/messages?limit=100`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setMessages(d.data || []))
      .catch(() => {});

    // mark read
    fetch(`/api/v1/chat/conversations/${conversationId}/read`, { method: "POST", credentials: "include" }).catch(() => {});

    // load templates for partners
    if (role === "PARTNER") {
      fetch("/api/v1/partner/chat-templates", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => setTemplates(d.data || []))
        .catch(() => {});
    }
  }, [conversationId, role]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat/${conversationId}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          setMessages((prev) => [...prev, data.data]);
          fetch(`/api/v1/chat/conversations/${conversationId}/read`, { method: "POST", credentials: "include" }).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [conversationId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (body: string, attachments?: { url: string; type: string; name?: string; size?: number }[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!body.trim() && (!attachments || attachments.length === 0)) return;
    wsRef.current.send(JSON.stringify({ body: body.trim(), attachments }));
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/chat/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (res.ok && data.data) {
        sendMessage("", [data.data]);
      } else {
        alert(data?.error?.message || "Ошибка загрузки");
      }
    } finally {
      setUploading(false);
    }
  };

  const insertTemplate = (t: Template) => {
    setInput(t.body);
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Чат</h2>
        <span className={`text-sm ${connected ? "text-[#1F7A4C]" : "text-[#7C6F65]"}`}>
          {connected ? "Подключен" : "Отключен"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!isOwn && msg.sender?.name && (
                  <p className="text-xs font-medium mb-1">{msg.sender.name}</p>
                )}
                {msg.body ? <p className="text-sm whitespace-pre-wrap">{msg.body}</p> : null}
                {msg.attachments && msg.attachments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {msg.attachments.map((a) => (
                      <div key={a.id}>
                        {a.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.url} alt={a.name || "image"} className="max-h-48 rounded" />
                        ) : (
                          <a href={a.url} target="_blank" rel="noreferrer" className="text-xs underline">
                            {a.name || "Файл"}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  {isOwn ? " ✓" : ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {role === "PARTNER" && templates.length > 0 ? (
        <div className="border-t px-4 py-2 flex flex-wrap gap-1">
          {templates.map((t) => (
            <button key={t.id} type="button" className="rounded-full border px-2 py-0.5 text-xs hover:bg-accent" onClick={() => insertTemplate(t)}>
              {t.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadFile(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!connected || uploading}>
            {uploading ? "..." : "📎"}
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Написать сообщение..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            disabled={!connected}
          />
          <Button onClick={() => sendMessage(input)} disabled={!connected || (!input.trim())}>
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
