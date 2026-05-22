import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-shell">
      <div className="not-found-card">
        <p className="eyebrow">404</p>
        <h1>这一页没有找到</h1>
        <p>
          可能是武将名或皮肤名不存在，也可能链接已经失效。
        </p>
        <Link href="/" className="primary-link">
          返回首页
        </Link>
      </div>
    </main>
  );
}
