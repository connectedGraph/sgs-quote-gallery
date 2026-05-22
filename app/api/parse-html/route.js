import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function extractAudios(blockHtml) {
  const audios = [];
  const audioRe = /<(?:audio|source|a)[^>]*(?:src|href)=["']([^"']+\.(?:mp3|ogg|wav|m4a|aac))["'][^>]*>/gi;
  let match;
  while ((match = audioRe.exec(blockHtml)) !== null) {
    audios.push(match[1]);
  }
  return audios;
}

function splitBlocksBySkill(html) {
  const headingRe = /<(h[1-6]|dt|b|strong)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks = [];
  let lastIndex = 0;
  let lastName = null;
  let match;

  while ((match = headingRe.exec(html)) !== null) {
    if (lastName !== null) {
      blocks.push({ name: lastName, html: html.slice(lastIndex, match.index) });
    }
    lastName = stripTags(match[2]);
    lastIndex = match.index + match[0].length;
  }

  if (lastName !== null) {
    blocks.push({ name: lastName, html: html.slice(lastIndex) });
  }

  return blocks;
}

function parseQuotesFromBlock(blockHtml) {
  const audios = extractAudios(blockHtml);
  const cleaned = blockHtml.replace(/<(audio|source|script|style)[\s\S]*?<\/\1>/gi, " ");

  const candidates = [];
  const itemRe = /<(li|dd|p|tr|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = itemRe.exec(cleaned)) !== null) {
    const text = stripTags(match[2]);
    if (text && text.length >= 2 && text.length <= 200) {
      candidates.push(text);
    }
  }

  if (!candidates.length) {
    const fallback = stripTags(cleaned);
    if (fallback) {
      fallback
        .split(/[。！？!?；;]/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 2 && sentence.length <= 80)
        .forEach((sentence) => candidates.push(sentence));
    }
  }

  const seen = new Set();
  const quotes = [];
  candidates.forEach((text, index) => {
    if (seen.has(text)) return;
    seen.add(text);
    quotes.push({
      text,
      explanation: "",
      audio: audios[index] || "",
    });
  });

  return quotes;
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ success: false, message: "请求体不是合法 JSON" }, { status: 400 });
  }

  const html = typeof payload?.html === "string" ? payload.html.trim() : "";
  if (!html) {
    return NextResponse.json({ success: false, message: "请提供 html 字段" }, { status: 400 });
  }

  try {
    const blocks = splitBlocksBySkill(html);
    const skills = [];

    if (blocks.length) {
      for (const block of blocks) {
        const quotes = parseQuotesFromBlock(block.html);
        if (block.name && quotes.length) {
          skills.push({ name: block.name, quotes });
        }
      }
    }

    if (!skills.length) {
      const quotes = parseQuotesFromBlock(html);
      if (quotes.length) {
        skills.push({ name: "未命名技能", quotes });
      }
    }

    if (!skills.length) {
      return NextResponse.json({
        success: false,
        message: "未能识别出技能或台词，请检查 HTML 片段",
      });
    }

    const totalQuotes = skills.reduce((sum, skill) => sum + skill.quotes.length, 0);

    return NextResponse.json({
      success: true,
      data: {
        hero: typeof payload?.hero === "string" ? payload.hero : "",
        skin: typeof payload?.skin === "string" ? payload.skin : "",
        skills,
      },
      stats: {
        skillsCount: skills.length,
        totalQuotes,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "解析失败" },
      { status: 500 },
    );
  }
}
