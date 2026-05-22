import { NextResponse } from "next/server";
import { deleteItem, getDetailPageData, updateItem } from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

function decodeParam(value) {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

export async function GET(_request, { params }) {
  const resolved = await params;
  const hero = decodeParam(resolved.hero);
  const skin = decodeParam(resolved.skin);
  const item = getDetailPageData(hero, skin);

  if (!item) {
    return NextResponse.json({ message: "未找到对应皮肤" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(request, { params }) {
  const resolved = await params;
  const hero = decodeParam(resolved.hero);
  const skin = decodeParam(resolved.skin);

  let payload;
  try {
    payload = await request.json();
  } catch (_error) {
    return NextResponse.json({ message: "请求体不是合法 JSON" }, { status: 400 });
  }

  try {
    const updated = updateItem(hero, skin, payload);
    return NextResponse.json({ message: "更新成功", data: updated });
  } catch (error) {
    const status = error.message?.includes("没找到") ? 404 : 400;
    return NextResponse.json({ message: error.message || "更新失败" }, { status });
  }
}

export async function DELETE(_request, { params }) {
  const resolved = await params;
  const hero = decodeParam(resolved.hero);
  const skin = decodeParam(resolved.skin);

  const removed = deleteItem(hero, skin);
  if (!removed) {
    return NextResponse.json({ message: "未找到对应皮肤" }, { status: 404 });
  }

  return NextResponse.json({ message: "删除成功" });
}
