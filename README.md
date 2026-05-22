# 三国杀台词鉴赏 

> 一个把单页台词页改造成可直达内容站的小项目。Next.js 16 App Router + React 19，纯本地 JSON 数据，无数据库、无登录。

> 这是一个个人练手仓库：一边整理 3 个三国杀皮肤的台词、出处和意境，一边把展示形态从早期的「单页 + fetch」改成可直接 `/hero/徐妏/丹青入墨` 直达的多页面站。同时保留早期写的展示页 `show.html` 与编辑页 `CRUD.html`，作为「同一份数据，三种形态」的对照。

---

> 台词数据当年是搞了逆向 API，直接从 bwiki 爬出来的。这玩意儿还是大一上学期折腾的，现在细节已经忘光了，只记得当时为了摸索出那个 URL 真的费了贼大劲。项目一直没发出来，确实拖了蛮久，不过最近和 CC 人机协作，把前端重构成 React 后，整体体验明显舒服多了。

> 遗憾的是，当年的 Pipeline 脚本现在不知道被我丢哪儿去了，可能不小心给删了。当时的大致思路是：先去全英雄页复制所有武将名单，然后拼接 URL 去抓取包含台词字段的 JSON。另外，音频（audio）数据得下载 HTML 才能拿到，不过后来我发现音频的路由规律其实就是拼音，最后靠着 HTML 和拼音路由交叉比对，总算搞定了一部分。

> 当时处理原始数据也挺折腾，html形式不是固定的，要特殊处理就没加上；还有些带 SP 前缀的特例必须单独写逻辑处理，前前后后确实磨了很久。

## 看一眼

| 形态 | 路径 | 角色 |
| --- | --- | --- |
| 多页面展示站（主） | `/`, `/hero/[hero]`, `/hero/[hero]/[skin]` | 默认入口，可直达，可分享 |
| 单页阅读（旧） | `/show.html` | 小尺寸列表 + 阅读器，老式静态页 |
| 编辑后台 | `/CRUD.html` | 改 `db/line.json` 的脚手架页面 |

三种形态共用：

- 同一份 `db/line.json`
- 同一套 Next API（`/api/quotes`、`/api/quotes/[hero]/[skin]`、`/api/parse-html`、`/api/ai/parse-quote`）
- 同一套 **宣纸** 主题（明亮模式纸纤维 + 朱印；夜间模式深墨）
- 浏览器右上角的「夜间 / 日间」切换按钮，三个页面互通（`localStorage.sgs-quote-theme`）
- 樱花飘落（`/樱花散落.js`），顶部的「樱花」按钮可关掉

## 预览

把截图放到 `screenshots/` 下，对应：

```md
![Home](./screenshots/home.png)
![Hero](./screenshots/hero.png)
![Detail](./screenshots/detail.png)
![Show](./screenshots/show.png)
![CRUD](./screenshots/crud.png)
```

## 本地启动

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
```

> 工程目录名包含全角 `？`（`v3 next？`），所有 shell 命令都需要把路径加引号。

## 目录结构

```text
.
├── app/
│   ├── api/
│   │   ├── quotes/route.js                 # GET 列表 / POST 新建
│   │   ├── quotes/[hero]/[skin]/route.js   # GET 详情 / PUT 更新 / DELETE 删除
│   │   ├── parse-html/route.js             # POST 从 HTML 片段解析技能与台词
│   │   └── ai/parse-quote/route.js         # POST 生成解析骨架（占位实现）
│   ├── hero/[hero]/page.js
│   ├── hero/[hero]/[skin]/page.js
│   ├── globals.css                         # 宣纸主题
│   ├── layout.js                           # 全局 Sakura + ThemeToggle
│   ├── not-found.js
│   └── page.js
├── components/
│   ├── audio-button.js
│   ├── hero-index-client.js
│   ├── sakura-canvas.js
│   └── theme-toggle.js
├── lib/
│   └── quotes-data.js                      # 读取 / 索引 / 写回 line.json
├── public/
│   ├── show.html                           # 单页阅读（重写后）
│   ├── CRUD.html                           # 编辑后台（重新主题化）
│   ├── CRUD-style.css
│   ├── style.css
│   ├── xuanzhi-theme.css                   # 共享主题色
│   ├── xuanzhi-theme.js                    # 浮动主题/樱花按钮
│   └── 樱花散落.js                          # 樱花动画
└── db/
    └── line.json                           # 数据真源
```

## 数据形状

`db/line.json` 是一个数组，每一项代表「武将 + 一套皮肤」：

```json
{
  "hero": "徐妏",
  "skin": "丹青入墨",
  "skills": [
    {
      "name": "摹画",
      "quotes": [
        {
          "text": "半尺生绢藏天地，丹青不让万夫雄。",
          "explanation": "* **半尺生绢**：尺幅虽小，气象不让……",
          "audio": "https://example.com/clip.mp3"
        }
      ]
    }
  ]
}
```

字段约定：

- `explanation` 是 Markdown，详情页通过 `marked.parse` 渲染。
- `audio` 可以缺省或为空字符串，前端会渲染为不可点的「无」按钮。
- `line.json` ≈ 6.7 MB，**不要从客户端直接拉取整份**。

## 数据层做了什么

`lib/quotes-data.js` 做三件事：

1. **懒加载 + 内存索引**：首次访问时读 `line.json`，构建 `heroMap`、`detailMap`、`heroGroups`、`summaries`、`stats`，页面查询都是 O(1)。
2. **`fs.watch` 热更新**：监听 `db/line.json`，120 ms 防抖后重建索引。重建失败保留上一份缓存。
3. **重试读 / 原子写**：Windows 下编辑器经常和 watcher 抢锁，所以读路径有短暂忙等重试（4 次 × 90 ms），写路径走 tmp file + rename，rename 失败也会重试再清理 tmp。

页面侧每个路由都设了 `export const dynamic = "force-dynamic"`，避免静态缓存让热更新失效。

## 路由表

| 路径 | 类型 | 说明 |
| --- | --- | --- |
| `/` | 页面 | 首页：检索 + 武将总览 + 快速直达 |
| `/hero/[hero]` | 页面 | 武将页：该武将下的全部皮肤 |
| `/hero/[hero]/[skin]` | 页面 | 详情页：技能 / 台词 / 解析 / 试听 |
| `/show.html` | 静态 | 旧版单页阅读器 |
| `/CRUD.html` | 静态 | 编辑后台（仅本地用） |

中文段路由都依赖 Next 的自动解码，所以页面组件内还要 `decodeURIComponent(params.hero)`；`params` 在 Next 16 里是 Promise，`await params` 之后再读。链接都用 `encodeURIComponent` 包两段。

## API

所有 API 在 `app/api/` 下，请求体 / 响应体均为 JSON。写操作在成功后会把 `line.json` 原子重写并刷新内存索引。

### `GET /api/quotes`

返回全部皮肤条目（数组）。可选过滤：

- `?hero=徐妏` — 只返回该武将
- `?hero=徐妏&skin=丹青入墨` — 数组形式返回（兼容旧前端）

```bash
curl http://localhost:3000/api/quotes
curl "http://localhost:3000/api/quotes?hero=%E5%BE%90%E5%A6%8F"
```

### `POST /api/quotes`

新建一条皮肤数据。

```http
POST /api/quotes
Content-Type: application/json

{
  "hero": "徐妏",
  "skin": "丹青入墨",
  "skills": [
    { "name": "摹画", "quotes": [{ "text": "...", "explanation": "...", "audio": "" }] }
  ]
}
```

- 成功：`201 { "message": "创建成功", "data": <item> }`
- 已存在同 `hero+skin`：`400 { "message": "已存在 ..." }`

### `GET /api/quotes/[hero]/[skin]`

读取单条详情。中文段需要 URL 编码。

- 命中：`200 <item>`
- 未命中：`404 { "message": "未找到对应皮肤" }`

### `PUT /api/quotes/[hero]/[skin]`

整条覆盖式更新。允许同时改名（hero/skin 与 URL 不一致），但目标若已存在会拒绝。

- 成功：`200 { "message": "更新成功", "data": <item> }`
- 原始记录不存在：`404`
- 改名冲突：`400`

### `DELETE /api/quotes/[hero]/[skin]`

删除一条皮肤数据。

- 成功：`200 { "message": "删除成功" }`
- 未命中：`404`

### `POST /api/parse-html`

CRUD 页粘贴 wiki 片段时调用，返回结构化技能 / 台词列表。

```http
POST /api/parse-html
Content-Type: application/json

{
  "html": "<h3>摹画</h3><ul><li>...</li></ul>",
  "hero": "徐妏",
  "skin": "丹青入墨"
}
```

```json
{
  "success": true,
  "data": { "hero": "徐妏", "skin": "丹青入墨", "skills": [/* ... */] },
  "stats": { "skillsCount": 3, "totalQuotes": 12 }
}
```

启发式实现：用 `<h*>/<dt>/<b>/<strong>` 切分技能段，再在每段里抓 `<li>/<p>/<dd>/<tr>/<div>` 当台词，`<audio>/<source>` 的 `src` / `<a>` 的 `.mp3` 链接当音频。够用即可，复杂排版可能需要事后手改。

### `POST /api/ai/parse-quote`

为一句台词生成 Markdown 解析骨架，目前是**占位实现**（按标点分词，给出三段空白模板供人工补全）。要接真正的大模型，替换 `app/api/ai/parse-quote/route.js` 里的 `buildExplanationSkeleton` 即可。

```http
POST /api/ai/parse-quote
Content-Type: application/json

{ "quote": "半尺生绢藏天地，丹青不让万夫雄。" }
```

```json
{
  "success": true,
  "explanation": "**台词**\n\n> ...\n\n**字面解读**\n\n* **半尺生绢**：\n* ...",
  "note": "本机器接入位为占位实现..."
}
```

## 主题

明亮模式走 **宣纸**：暖米黄底 + 重复短线模拟纸纤维 + 朱砂色作为强调与「印」框线。夜间模式是深墨基调，把朱砂换成偏暖的旧纸金。

实现要点：

- `localStorage.sgs-quote-theme`（值：`light` / `dark`）。三个页面共用同一个键。
- Next 端：`app/layout.js` 在 `<head>` 里塞一个先行脚本，避免暗色模式刷新时闪白。
- 静态页：`public/xuanzhi-theme.js` 做同样的事，并自动注入右上角的浮动「夜间 / 樱花」按钮。
- 按钮文案随主题切换（夜间 ↔ 日间）。
- 樱花动画通过 `window.sakuraControl.toggle()` 关 / 开。

## 验证

目前没接 lint / 测试，验证就靠 `npm run build` 和手动点：

- 首页能渲染、统计数据正确
- `/hero/[hero]`、`/hero/[hero]/[skin]` 能直达
- 不存在的武将 / 皮肤走 404
- `show.html`、`CRUD.html` 都能加载，主题与 Next 页同步
- CRUD 创建 / 更新 / 删除一条记录后，`db/line.json` 自动更新，Next 站点同步刷新
- 关掉樱花按钮后再刷新页面也保持关闭

## 当前边界

- 没接数据库，单机文件即真源。
- CRUD 页是裸接 API 的工具页，没有登录、权限、审计。**只在本地跑，不要直接暴露到公网。**
- `public/CRUD.html` 默认走 `/api`，所以也只能在和 Next 同源的环境工作。
- `db/数据工具/` 是一些做爬取 / 清洗的独立脚本，不进 Next 流程。

## 后续有可能会做

- 详情页加上 prev / next 跳转
- 站点级搜索（按台词内容搜，而不只是名字）
- `/api/ai/parse-quote` 接入真正的大模型
- 给 CRUD 加个最简单的本地口令保护
- 详情页静态生成 + 增量重新校验，去掉 `force-dynamic`

## 致谢
- 感谢 bilibiliWiki 为三国杀社区生态的贡献。
- 感谢 **狗卡** 搞出来这么个能海纳百川的游戏。大家玩游戏的出发点各不相同，但也少不了和我一样热爱三国杀台词古文的。不得不说，狗卡的文案和美工确实审美在线。尤其是~~烧鸡~~女武将们的插画和台词，顶顶顶。
