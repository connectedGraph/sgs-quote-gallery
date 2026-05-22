import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildExplanationSkeleton(quote) {
  const trimmed = quote.trim();
  const tokens = trimmed.split(/[，,。！？、；,.!?;\s]+/).filter((token) => token.length >= 2);
  const highlights = tokens.slice(0, 3);

  const lines = ["**台词**", "", `> ${trimmed}`, "", "**字面解读**", ""];

  if (highlights.length) {
    highlights.forEach((token) => {
      lines.push(`* **${token}**：`);
    });
  } else {
    lines.push("* **关键词**：");
  }

  lines.push("", "**典故与意图**", "", "* ", "", "**人物心境**", "", "* ");

  return lines.join("\n");
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ success: false, message: "请求体不是合法 JSON" }, { status: 400 });
  }

  const quote = typeof payload?.quote === "string" ? payload.quote.trim() : "";
  if (!quote) {
    return NextResponse.json({ success: false, message: "请提供 quote 字段" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    explanation: buildExplanationSkeleton(quote),
    note: "本机器接入位为占位实现，返回结构化 Markdown 模板供人工补全。如需接入大模型，请在该路由中替换 buildExplanationSkeleton。",
  });
}
