import fs from "fs";
import path from "path";
import { getPinyinInitial } from "./pinyin.js";

const DB_PATH = path.join(process.cwd(), "db", "line.json");
const RELOAD_DEBOUNCE_MS = 120;
const READ_RETRY_COUNT = 4;
const READ_RETRY_DELAY_MS = 90;

let cache = null;
let watcherInitialized = false;
let reloadTimer = null;

function stripBom(rawText) {
  return rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
}

function sleepSync(delayMs) {
  const endAt = Date.now() + delayMs;

  while (Date.now() < endAt) {
    // Busy wait intentionally kept tiny for short file-lock retries.
  }
}

function safeReadJsonFile() {
  let lastError = null;

  for (let attempt = 0; attempt <= READ_RETRY_COUNT; attempt += 1) {
    try {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      const normalized = stripBom(raw);
      const list = JSON.parse(normalized);

      if (!Array.isArray(list)) {
        throw new Error("line.json 必须是数组结构");
      }

      return list;
    } catch (error) {
      lastError = error;

      const shouldRetry =
        attempt < READ_RETRY_COUNT &&
        (error?.code === "EBUSY" || error instanceof SyntaxError);

      if (!shouldRetry) {
        break;
      }

      sleepSync(READ_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

function buildIndexes(items) {
  const heroMap = new Map();
  const detailMap = new Map();
  let quoteCount = 0;

  for (const item of items) {
    const detailKey = createDetailKey(item.hero, item.skin);
    detailMap.set(detailKey, item);

    if (!heroMap.has(item.hero)) {
      heroMap.set(item.hero, []);
    }
    heroMap.get(item.hero).push(item);

    for (const skill of item.skills || []) {
      quoteCount += Array.isArray(skill.quotes) ? skill.quotes.length : 0;
    }
  }

  const sortedHeroes = [...heroMap.keys()].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const heroGroups = sortedHeroes.map((hero) => {
    const skins = [...heroMap.get(hero)]
      .sort((a, b) => a.skin.localeCompare(b.skin, "zh-CN"))
      .map((item) => ({
        hero: item.hero,
        skin: item.skin,
        skillCount: Array.isArray(item.skills) ? item.skills.length : 0,
        quoteCount: countQuotes(item),
      }));

    return {
      hero,
      initial: getPinyinInitial(hero),
      skins,
    };
  });

  const summaries = heroGroups.flatMap((group) =>
    group.skins.map((skin) => ({
      hero: group.hero,
      skin: skin.skin,
      skillCount: skin.skillCount,
      quoteCount: skin.quoteCount,
    })),
  );

  const sidebarSummaries = items.map((item) => ({
    hero: item.hero,
    skin: item.skin,
    missingAudio: hasMissingAudio(item),
  }));

  return {
    items,
    heroMap,
    detailMap,
    heroGroups,
    summaries,
    sidebarSummaries,
    stats: {
      heroCount: heroMap.size,
      itemCount: items.length,
      quoteCount,
    },
    loadedAt: Date.now(),
  };
}

function hasMissingAudio(item) {
  for (const skill of item.skills || []) {
    for (const quote of skill.quotes || []) {
      if (!quote || typeof quote.audio !== "string" || !quote.audio.trim()) {
        return true;
      }
    }
  }
  return false;
}

function createDetailKey(hero, skin) {
  return `${hero}::${skin}`;
}

function countQuotes(item) {
  return (item.skills || []).reduce((total, skill) => {
    return total + (Array.isArray(skill.quotes) ? skill.quotes.length : 0);
  }, 0);
}

function loadCache() {
  const nextItems = safeReadJsonFile();
  cache = buildIndexes(nextItems);
  return cache;
}

function safeWriteJsonFile(items) {
  if (!Array.isArray(items)) {
    throw new Error("写入数据必须是数组结构");
  }

  const dir = path.dirname(DB_PATH);
  const tmpPath = path.join(dir, `.line.json.${process.pid}.${Date.now()}.tmp`);
  const payload = `${JSON.stringify(items, null, 2)}\n`;

  fs.writeFileSync(tmpPath, payload, "utf8");

  let lastError = null;
  for (let attempt = 0; attempt <= READ_RETRY_COUNT; attempt += 1) {
    try {
      fs.renameSync(tmpPath, DB_PATH);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt === READ_RETRY_COUNT || error?.code !== "EBUSY") {
        break;
      }
      sleepSync(READ_RETRY_DELAY_MS);
    }
  }

  if (lastError) {
    try {
      fs.unlinkSync(tmpPath);
    } catch (_cleanupError) {
      // best-effort cleanup
    }
    throw lastError;
  }
}

function getCache() {
  if (!cache) {
    loadCache();
  }

  ensureWatcher();
  return cache;
}

function ensureWatcher() {
  if (watcherInitialized) {
    return;
  }

  watcherInitialized = true;

  fs.watch(DB_PATH, { persistent: false }, () => {
    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }

    reloadTimer = setTimeout(() => {
      try {
        loadCache();
        console.log("[quotes-data] line.json 已自动重载");
      } catch (error) {
        console.error("[quotes-data] line.json 重载失败，保留上一版缓存:", error);
      }
    }, RELOAD_DEBOUNCE_MS);
  });
}

export function getHeroGroups() {
  return getCache().heroGroups;
}

export function getStats() {
  return getCache().stats;
}

export function getAllSummaries() {
  return getCache().summaries;
}

export function getAllHeroes() {
  return getCache().heroGroups.map((group) => group.hero);
}

export function getHeroPageData(hero) {
  const matched = getCache().heroMap.get(hero);

  if (!matched) {
    return null;
  }

  return {
    hero,
    skins: [...matched]
      .sort((a, b) => a.skin.localeCompare(b.skin, "zh-CN"))
      .map((item) => ({
        hero: item.hero,
        skin: item.skin,
        skillCount: Array.isArray(item.skills) ? item.skills.length : 0,
        quoteCount: countQuotes(item),
      })),
  };
}

export function getDetailPageData(hero, skin) {
  return getCache().detailMap.get(createDetailKey(hero, skin)) || null;
}

export function getAllHeroSkinParams() {
  return getCache().summaries.map((item) => ({
    hero: item.hero,
    skin: item.skin,
  }));
}

export function getAllItems() {
  return getCache().items;
}

export function getSidebarSummaries() {
  return getCache().sidebarSummaries;
}

function normalizeIncomingItem(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("请求体必须是 JSON 对象");
  }

  const hero = typeof payload.hero === "string" ? payload.hero.trim() : "";
  const skin = typeof payload.skin === "string" ? payload.skin.trim() : "";

  if (!hero || !skin) {
    throw new Error("hero 与 skin 不能为空");
  }

  const skills = Array.isArray(payload.skills) ? payload.skills : [];
  const cleanSkills = skills.map((skill) => {
    const name = typeof skill?.name === "string" ? skill.name.trim() : "";
    const quotes = Array.isArray(skill?.quotes) ? skill.quotes : [];
    const cleanQuotes = quotes.map((quote) => ({
      text: typeof quote?.text === "string" ? quote.text.trim() : "",
      explanation: typeof quote?.explanation === "string" ? quote.explanation : "",
      audio: typeof quote?.audio === "string" ? quote.audio.trim() : "",
    }));
    return { name, quotes: cleanQuotes };
  });

  return { hero, skin, skills: cleanSkills };
}

function persist(nextItems) {
  safeWriteJsonFile(nextItems);
  cache = buildIndexes(nextItems);
}

export function createItem(payload) {
  const item = normalizeIncomingItem(payload);
  const items = [...getCache().items];
  const exists = items.some((entry) => entry.hero === item.hero && entry.skin === item.skin);

  if (exists) {
    throw new Error(`已存在 ${item.hero} · ${item.skin}，请改用 PUT 更新`);
  }

  items.push(item);
  persist(items);
  return item;
}

export function updateItem(originalHero, originalSkin, payload) {
  const item = normalizeIncomingItem(payload);
  const items = [...getCache().items];
  const index = items.findIndex(
    (entry) => entry.hero === originalHero && entry.skin === originalSkin,
  );

  if (index === -1) {
    throw new Error(`没找到 ${originalHero} · ${originalSkin}`);
  }

  const renaming = item.hero !== originalHero || item.skin !== originalSkin;
  if (renaming) {
    const conflict = items.some(
      (entry, i) => i !== index && entry.hero === item.hero && entry.skin === item.skin,
    );
    if (conflict) {
      throw new Error(`目标 ${item.hero} · ${item.skin} 已存在，无法改名`);
    }
  }

  items[index] = item;
  persist(items);
  return item;
}

export function deleteItem(hero, skin) {
  const items = getCache().items;
  const filtered = items.filter((entry) => !(entry.hero === hero && entry.skin === skin));

  if (filtered.length === items.length) {
    return false;
  }

  persist(filtered);
  return true;
}
