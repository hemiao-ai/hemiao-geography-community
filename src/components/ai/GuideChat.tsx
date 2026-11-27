"use client";

import { useEffect, useRef, useState } from "react";
import { ChatCircleDots, PaperPlaneRight, Plus, Sparkle, Stop } from "@/components/ui/Icon";
import { MAX_HISTORY, MAX_QUESTION, type ChatMessage } from "@/lib/ai/guide";
import { COMMUNITY_REPO_URL } from "@/lib/site";

const suggestions = [
  "为什么赤道附近终年炎热？",
  "等高线越密，说明什么？",
  "我国东部为什么夏季多雨？",
  "出一道经纬网的题考考我",
];

function MessageText({ content }: { content: string }) {
  return content.split(/(\*\*[^*\n]+\*\*)/g).map((part, index) =>
    index % 2 ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

export function GuideChat({ enabled, point, lessonTitle }: { enabled: boolean; point?: string; lessonTitle?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, pending]);

  async function send(question = draft) {
    const content = question.trim();
    if (!content || request.current) return;
    const controller = new AbortController();
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    request.current = controller;
    setPending(content);
    setDraft("");
    setError("");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point, messages: next.slice(-(MAX_HISTORY * 2 + 1)) }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.reply !== "string") {
        throw new Error(result?.error || "暂时无法回答，请稍后再试。");
      }
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (cause) {
      setDraft(content);
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "发送失败，请稍后再试。");
    } finally {
      request.current = null;
      setPending("");
    }
  }

  if (!enabled) return <section className="panel mx-auto max-w-2xl p-6 sm:p-8">
    <span className="grid size-10 place-items-center rounded-[10px] bg-accent/12 text-accent"><Sparkle size={22} aria-hidden="true" /></span>
    <h2 className="h-display mt-4 text-xl">等待连接模型服务</h2>
    <p className="mt-2 max-w-xl text-sm leading-7 text-muted">此站点还未配置 AI 模型。部署者接入模型服务后，就可以免登录问答。</p>
    <a href={`${COMMUNITY_REPO_URL}#配置-ai-地理向导`} target="_blank" rel="noreferrer" className="btn mt-5">查看模型配置说明</a>
  </section>;

  return <section className="panel mx-auto flex min-h-[min(65dvh,32rem)] max-w-3xl flex-col overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-panel-border px-4 py-3 sm:px-6">
      <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
        <ChatCircleDots size={19} className="shrink-0 text-accent" aria-hidden="true" /><span className="truncate">{lessonTitle ? `正在讨论 · ${lessonTitle}` : "问问芽芽"}</span>
      </span>
      {messages.length > 0 && <button type="button" className="btn btn-secondary btn-sm shrink-0" disabled={!!pending}
        onClick={() => { setMessages([]); setDraft(""); setError(""); input.current?.focus(); }}><Plus size={16} aria-hidden="true" />新对话</button>}
    </div>
    <div role="log" aria-label="对话记录" className="min-h-44 max-h-[55dvh] flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
      {!messages.length && !pending && <div className="mx-auto max-w-md py-5 text-center">
        <h2 className="h-display text-xl">今天想弄懂什么？</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {suggestions.map(question => <button key={question} type="button" onClick={() => void send(question)}
            className="rounded-[10px] border border-dashed border-panel-border bg-panel-solid px-3 py-2.5 text-left text-sm font-semibold hover:border-accent hover:text-accent">{question}</button>)}
        </div>
      </div>}
      {[...messages, ...(pending ? [{ role: "user" as const, content: pending }] : [])].map((message, index) =>
        <div key={index} className={message.role === "user" ? "ml-auto w-fit max-w-[85%]" : "mr-auto w-fit max-w-[92%]"}>
          <p className={`mb-1 text-xs font-semibold text-muted ${message.role === "user" ? "text-right" : ""}`}>{message.role === "user" ? "你" : "芽芽"}</p>
          <div className={`whitespace-pre-wrap break-words rounded-xl px-4 py-2.5 text-sm leading-7 ${message.role === "user" ? "bg-accent text-accent-ink" : "border border-panel-border bg-panel-solid"}`}><MessageText content={message.content} /></div>
        </div>)}
      {pending && <p role="status" className="text-sm text-muted">芽芽正在思考…</p>}
      <div ref={end} />
    </div>
    <form className="border-t border-panel-border p-4 sm:px-6" onSubmit={event => { event.preventDefault(); void send(); }}>
      {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
      <div className="flex items-end gap-2 rounded-[10px] border border-panel-border bg-panel-solid p-2 focus-within:border-accent">
        <textarea ref={input} rows={2} aria-label="地理问题" placeholder="输入你的地理问题" value={draft} maxLength={MAX_QUESTION}
          disabled={!!pending} onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }}
          className="min-w-0 flex-1 resize-y bg-transparent px-2 py-1 text-sm leading-6 outline-none" />
        {pending ? <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={() => request.current?.abort()}><Stop size={16} aria-hidden="true" />停止</button>
          : <button type="submit" className="btn btn-sm shrink-0" disabled={!draft.trim()}><PaperPlaneRight size={16} aria-hidden="true" />发送</button>}
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">问题会发送到本站配置的模型服务。回答由 AI 生成，请以教材为准。</p>
    </form>
  </section>;
}
