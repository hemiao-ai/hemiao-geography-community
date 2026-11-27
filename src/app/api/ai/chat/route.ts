import { guideConfig } from "@/lib/ai/config";
import { MAX_REPLY, parseChat } from "@/lib/ai/guide";

const MAX_BODY = 96 * 1024;
const headers = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return Response.json({ error }, { headers, status });
}

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    return parseChat(JSON.parse(body + decoder.decode()));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const origin = URL.parse(request.headers.get("origin") ?? "");
  if (!origin || !["http:", "https:"].includes(origin.protocol) || origin.host !== request.headers.get("host")) {
    return fail("请从当前学习台发送问题。", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return fail("请求格式无效。", 415);
  }

  const config = guideConfig();
  if (!config) return fail("当前站点还没有配置 AI 模型服务。", 503);
  const messages = await readBody(request);
  if (!messages) return fail("请检查问题内容和长度后重试。", 400);

  const timeout = AbortSignal.timeout(45_000);
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}),
      },
      body: JSON.stringify({ model: config.model, messages, max_completion_tokens: 1000 }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, timeout]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      return response.status === 429
        ? fail("模型服务暂时繁忙，请稍后重试。", 429)
        : fail("模型服务暂时不可用，请稍后重试。", 502);
    }
    const result = await response.json();
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) return fail("没有收到有效回答，请再试一次。", 502);
    return Response.json({ reply: reply.trim().slice(0, MAX_REPLY) }, { headers });
  } catch {
    return timeout.aborted ? fail("模型回答超时，请稍后重试。", 504) : fail("暂时无法连接模型服务，请稍后重试。", 502);
  }
}
