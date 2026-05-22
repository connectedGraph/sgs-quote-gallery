import { NextResponse } from "next/server";
import { createItem, getAllItems, getDetailPageData } from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hero = searchParams.get("hero");
  const skin = searchParams.get("skin");

  if (hero && skin) {
    const item = getDetailPageData(hero, skin);
    return NextResponse.json(item ? [item] : []);
  }

  if (hero) {
    return NextResponse.json(getAllItems().filter((entry) => entry.hero === hero));
  }

  return NextResponse.json(getAllItems());
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ message: "请求体不是合法 JSON" }, { status: 400 });
  }

  try {
    const item = createItem(payload);
    return NextResponse.json({ message: "创建成功", data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message || "创建失败" }, { status: 400 });
  }
}
