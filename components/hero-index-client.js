"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PINYIN_LETTERS } from "@/lib/pinyin";

const VIEWS_STORAGE_KEY = "sgs-quote-views";

function readViewMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(VIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch (_error) {
    return {};
  }
}

export function HeroIndexClient({ heroGroups, summaries }) {
  const [query, setQuery] = useState("");
  const [viewMap, setViewMap] = useState({});
  const keyword = query.trim().toLowerCase();

  useEffect(() => {
    setViewMap(readViewMap());
    const onStorage = (event) => {
      if (event.key === VIEWS_STORAGE_KEY) {
        setViewMap(readViewMap());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const summaryByKey = useMemo(() => {
    const map = new Map();
    summaries.forEach((item) => {
      map.set(`${item.hero}::${item.skin}`, item);
    });
    return map;
  }, [summaries]);

  const filteredGroups = useMemo(() => {
    if (!keyword) return heroGroups;
    return heroGroups
      .map((group) => {
        const heroText = group.hero.toLowerCase();
        if (heroText.includes(keyword)) return group;
        const skins = group.skins.filter((skin) =>
          skin.skin.toLowerCase().includes(keyword),
        );
        return skins.length ? { ...group, skins } : null;
      })
      .filter(Boolean);
  }, [heroGroups, keyword]);

  const featured = useMemo(() => {
    const decorate = (item) => {
      const entry = viewMap[`${item.hero}::${item.skin}`];
      return {
        ...item,
        viewCount: entry?.count || 0,
      };
    };

    if (keyword) {
      return summaries
        .filter(
          (item) =>
            item.hero.toLowerCase().includes(keyword) ||
            item.skin.toLowerCase().includes(keyword),
        )
        .slice(0, 14)
        .map(decorate);
    }

    const recents = Object.entries(viewMap)
      .map(([key, value]) => {
        const summary = summaryByKey.get(key);
        if (!summary) return null;
        return {
          ...summary,
          viewCount: value?.count || 0,
          lastViewed: value?.lastViewed || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.lastViewed - a.lastViewed)
      .slice(0, 14);

    if (recents.length) return recents;

    return summaries.slice(0, 14).map(decorate);
  }, [summaries, summaryByKey, viewMap, keyword]);

  const buckets = useMemo(() => {
    const map = new Map();
    filteredGroups.forEach((group) => {
      const key = group.initial || "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(group);
    });
    const order = (key) => {
      if (key === "#") return 999;
      const i = PINYIN_LETTERS.indexOf(key);
      return i === -1 ? 998 : i;
    };
    return [...map.entries()].sort((a, b) => order(a[0]) - order(b[0]));
  }, [filteredGroups]);

  const presentLetters = useMemo(() => {
    return new Set(buckets.map(([letter]) => letter));
  }, [buckets]);

  const railLetters = useMemo(() => {
    const arr = [...PINYIN_LETTERS];
    if (presentLetters.has("#")) arr.push("#");
    return arr;
  }, [presentLetters]);

  return (
    <>
      <section className="quick-row">
        <div className="quick-row-head">
          <p className="eyebrow">QUICK ACCESS</p>
          <h2>快速直达</h2>
        </div>
        <div className="quick-scroll">
          {featured.length ? (
            featured.map((item) => (
              <Link
                key={`${item.hero}::${item.skin}`}
                href={`/hero/${encodeURIComponent(item.hero)}/${encodeURIComponent(item.skin)}`}
                className="quick-card"
              >
                <span>{item.hero}</span>
                <strong>{item.skin}</strong>
                <em>
                  {item.skillCount} 技 · {item.quoteCount} 句
                </em>
                {item.viewCount > 0 && (
                  <span className="quick-card-views">已看 {item.viewCount} 次</span>
                )}
              </Link>
            ))
          ) : (
            <div className="quick-empty">没有匹配的皮肤</div>
          )}
        </div>
      </section>

      <section className="index-shell">
        <div className="search-panel">
          <label className="search-label" htmlFor="site-search">
            搜索武将或皮肤
          </label>
          <input
            id="site-search"
            className="search-box search-box-wide"
            type="text"
            placeholder="例如：徐妏、丹青入墨、SP"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="search-meta">
            <span>
              共 <strong>{heroGroups.length}</strong> 位武将
            </span>
            <span>
              当前显示 <strong>{filteredGroups.length}</strong> 位
            </span>
          </div>
        </div>

        <div className="hero-index-layout">
          <div className="hero-index-body">
            {buckets.length ? (
              buckets.map(([letter, groups]) => (
                <section
                  className="hero-bucket"
                  key={letter}
                  id={`bucket-${letter}`}
                >
                  <div className="hero-bucket-head">
                    <span className="bucket-letter">{letter}</span>
                    <span className="bucket-count">{groups.length} 位</span>
                  </div>
                  <div className="hero-grid">
                    {groups.map((group) => (
                      <article className="hero-tile" key={group.hero}>
                        <div className="hero-tile-head">
                          <Link
                            href={`/hero/${encodeURIComponent(group.hero)}`}
                            className="hero-tile-name"
                          >
                            {group.hero}
                          </Link>
                          <span className="hero-tile-count">
                            {group.skins.length}
                          </span>
                        </div>
                        <div className="hero-tile-chips">
                          {group.skins.slice(0, 4).map((skin) => (
                            <Link
                              key={`${group.hero}::${skin.skin}`}
                              href={`/hero/${encodeURIComponent(group.hero)}/${encodeURIComponent(skin.skin)}`}
                              className="hero-tile-chip"
                              title={skin.skin}
                            >
                              {skin.skin}
                            </Link>
                          ))}
                          {group.skins.length > 4 && (
                            <Link
                              href={`/hero/${encodeURIComponent(group.hero)}`}
                              className="hero-tile-chip hero-tile-chip-more"
                            >
                              +{group.skins.length - 4}
                            </Link>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="hero-empty">
                <h3>没有匹配的武将</h3>
                <p>换个关键词，或者清空搜索框看全部。</p>
              </div>
            )}
          </div>

          <nav className="pinyin-rail" aria-label="拼音索引">
            {railLetters.map((letter) => {
              const active = presentLetters.has(letter);
              return active ? (
                <a
                  key={letter}
                  href={`#bucket-${letter}`}
                  className="pinyin-rail-letter is-active"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  className="pinyin-rail-letter is-disabled"
                  aria-disabled="true"
                >
                  {letter}
                </span>
              );
            })}
          </nav>
        </div>
      </section>
    </>
  );
}
