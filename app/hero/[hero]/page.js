import Link from "next/link";
import { notFound } from "next/navigation";
import { getHeroPageData } from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const heroName = decodeURIComponent(resolvedParams.hero);
  const heroData = getHeroPageData(heroName);

  if (!heroData) {
    return {
      title: "武将未找到",
    };
  }

  return {
    title: `${heroName} · 三国杀台词鉴赏`,
    description: `${heroName} 的全部皮肤台词与解析入口页。`,
  };
}

export default async function HeroPage({ params }) {
  const resolvedParams = await params;
  const heroName = decodeURIComponent(resolvedParams.hero);
  const heroData = getHeroPageData(heroName);

  if (!heroData) {
    notFound();
  }

  return (
    <main className="subpage-shell">
      <section className="page-banner">
        <Link href="/" className="back-link">
          返回首页
        </Link>
        <p className="eyebrow">HERO ARCHIVE</p>
        <h1>{heroData.hero}</h1>
        <p>
          共收录 {heroData.skins.length} 套皮肤，点击任一条目进入完整台词详情页。
        </p>
      </section>

      <section className="skin-gallery">
        {heroData.skins.map((skin) => (
          <Link
            key={`${heroData.hero}::${skin.skin}`}
            href={`/hero/${encodeURIComponent(heroData.hero)}/${encodeURIComponent(skin.skin)}`}
            className="skin-card"
          >
            <span className="skin-card-label">皮肤</span>
            <strong>{skin.skin}</strong>
            <p>
              {skin.skillCount} 个技能 · {skin.quoteCount} 句台词
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
