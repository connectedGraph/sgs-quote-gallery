import Link from "next/link";
import { HeroIndexClient } from "@/components/hero-index-client";
import { getHeroGroups, getStats, getAllSummaries } from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "三国杀台词鉴赏",
  description: "浏览全部武将与皮肤台词，支持中文直达路由访问。",
};

export default function HomePage() {
  const heroGroups = getHeroGroups();
  const stats = getStats();
  const summaries = getAllSummaries();

  return (
    <main className="home-shell">
      <section className="home-banner">
        <div className="home-banner-text">
          <p className="eyebrow">SGS QUOTE ARCHIVE</p>
          <h1>三国杀台词鉴赏</h1>
          <p className="hero-lead">
            把单页浏览拆成可直达的内容站。从首页检索，
            或直接进入某位武将、某套皮肤的独立页面，逐句听，逐句读。
          </p>
        </div>
        <div className="home-banner-side">
          <div className="banner-stats">
            <div>
              <strong>{stats.heroCount}</strong>
              <span>武将</span>
            </div>
            <div>
              <strong>{stats.itemCount}</strong>
              <span>皮肤</span>
            </div>
            <div>
              <strong>{stats.quoteCount}</strong>
              <span>台词</span>
            </div>
          </div>
          <div className="banner-links">
            <Link href="/show.html" className="banner-link">
              旧版单页
            </Link>
            <Link href="/CRUD.html" className="banner-link">
              后台编辑
            </Link>
          </div>
        </div>
      </section>

      <HeroIndexClient heroGroups={heroGroups} summaries={summaries} />
    </main>
  );
}
