# Cortico 扩展市场升级:设计草案

状态:控制台前端已在 Cortico 分支 `feat/extension-market-index` 上实现(本地,未推);服务端读索引、Action 与 GitHub 仓库未做。本仓库尚未推到 GitHub。

## 目标与约束

- 给控制台扩展市场加上标签分类、官方推荐、拉黑、官方风险标注、评论与评分。
- 扩展本身照旧发布在 npm、从 npm 安装。
- 不自建服务。市场数据放 GitHub,假定下游开发者连得上 GitHub。
- 市场新增的文字只做中文和英文;控制台其他界面语言下显示英文。
- GitHub 连不上时,市场退回现在的样子(npm 搜索 + 下载量),安装不受影响。

## 组成

| 部分 | 位置 | 谁写 | 内容 |
|---|---|---|---|
| 扩展包 | npm | 作者 | 代码、package.json(含 `cortico` 块)、README |
| `index.json` | 本仓库 | 官方,走 PR | 标签词表、官方推荐、拉黑、对单个包的覆盖 |
| `catalog.json` | 本仓库 | Action 定时生成 | 每个包整理好的信息、图标截图地址、下载量、讨论帖统计 |
| `assets/` | 本仓库 | Action 定时生成 | 从 npm 包里解压出的图标和截图 |
| `TAGS.md` | 本仓库 | `scripts/render-tags.mjs` 生成 | 给作者和 coding agent 看的标签说明 |
| 讨论区 | 本仓库 Discussions | 用户 | 每个包一个帖,回复是评论,首楼 👍/👎 是评分 |
| 控制台 | Cortico | | 读 raw 上的 `index.json` 与 `catalog.json`,详情里嵌 giscus |

控制台读 `raw.githubusercontent.com`,不调 GitHub API(匿名每 IP 每小时 60 次)。raw 文件有 5 分钟 CDN 缓存。

## 每个扩展的信息

| 来源 | 信息 |
|---|---|
| 作者(package.json) | 包名、版本、简介、作者、许可证、主页 / 仓库 / 问题链接、`engines`、依赖、`os`、`funding`、README |
| 作者(`cortico` 块) | `kind`、`api`、`displayName`、`icon`、面板产物;新增 `tags`、`locales`、`screenshots` |
| 官方(`index.json`) | 是否官方发布(按 npm 维护者)、是否推荐及推荐语、是否拉黑、增删标签、官方标签及理由、「已被 X 取代」 |
| Action(`catalog.json`) | 上面作者字段的汇总、图标与截图地址、下载量(累计 / 30 天 / 7 天)、讨论帖编号、👍 / 👎 数、评论数 |
| 控制台现场算 | 已装、待重启、有更新、契约兼容 |

作者侧新增字段,全部可选,不改契约版本:

```jsonc
"cortico": {
  "kind": "world", "api": 5,
  "displayName": "B站直播",
  "icon": "assets/icon.png",
  "tags": ["streaming"],
  "locales": { "en": { "displayName": "Bilibili Live", "description": "Read danmaku and gifts from a Bilibili live room." } },
  "screenshots": ["assets/shot-1.png"]
}
```

`locales` 只认 `zh` 与 `en`,写了的语言覆盖顶层的 `displayName` 与 `description`。
只能在某些系统上跑用 npm 标准字段 `os`。

## 标签

词表与每个标签的用法见 [TAGS.md](TAGS.md)。要点:

- 13 个作者标签:im、qq、streaming、game、web、voice、desktop、memory、companion、creative、utility、local、external-setup。
- 4 个官方标签,作者写了无效、也去不掉:unsafe、sensitive-data、unofficial-api 显示为警示色;internal-state 显示为提示色。
- 不设数量上限。作者贴错,官方在 `overrides` 里改。
- 每个标签两段文字:`when` 给作者与 agent 判断该不该贴,`hint` 是用户悬停看到的说明。
- 一个包的标签 = 作者 `cortico.tags` 中词表内的作者标签 ∪ `keywords` 中属于词表的词 ∪ 官方 `addTags` − 官方 `removeTags`。
- 现有 60 个公开包里 58 个已在 `overrides` 里打好标签;`cortico-provider-deepseek` 与 `cortico-provider-coo` 是普通云端模型供应商,没有贴切的标签。

## 官方管理(`index.json`)

```jsonc
{
  "official": { "maintainers": ["phantivia"] },
  "tags": { "...": "见 TAGS.md" },
  "featured": [
    { "name": "cortico-world-bilibili", "note": { "zh": "...", "en": "..." } }
  ],
  "blocked": {
    "packages": { "cortico-world-xxx": "原因" },
    "publishers": { "some-npm-user": "原因" }
  },
  "overrides": {
    "cortico-world-python": {
      "addTags": ["utility", "unsafe"],
      "removeTags": [],
      "note": { "zh": "运行任意 Python 插件代码", "en": "Runs arbitrary Python plugin code" },
      "supersededBy": "另一个包名"
    }
  }
}
```

- **官方发布**:npm 维护者里有 `official.maintainers` 列出的账号就算官方发布,卡片标题旁是实心的「官方」徽标,标签条最前面有「官方」筛选。按维护者判断,不按发布者:用 GitHub Actions 发布的包发布者都显示为 GitHub Actions。
- **推荐**:按 `featured` 的顺序显示在市场顶部,卡片加角标。
- **拉黑**:被拉黑的包,或被拉黑的 npm 发布者发的所有包,不在市场里出现。手动按包名安装时提示拉黑原因,但不拦。已装的包不隐藏,在已安装列表里标红并显示原因。控制台把最近一次读到的 `index.json` 缓存在扩展目录里,连不上 GitHub 时继续按缓存拦。
- **官方标签的 `note`**:写这个包为什么被标,显示在详情和安装确认里。

## 评论与评分

- 本仓库开 Discussions,建一个 Announcement 格式的分类:只有维护者能开帖,任何人能回复。
- Action 发现 npm 上有新包就开帖,标题是包名。
- 评分是首楼的 👍 / 👎;GitHub 没有星级。评论是帖子回复。
- 详情抽屉里嵌 giscus(按包名对应帖子,严格匹配标题)。看评论不用登录;回复和点赞时在嵌入框里授权 giscus 这个 GitHub App,以用户自己的账号发出。Cortico 不经手 GitHub 账号或 token。
- 卡片上的 👍 数和「按评分排序」用 `catalog.json` 里 Action 取好的数,不必每张卡片加载 giscus。
- 先用 giscus.app 公共实例。它挂了只是评论区加载不出来;要换成自建,数据都在 Discussions 里,控制台改一个地址即可。
- 审核用 GitHub 自带的隐藏、删除、锁帖、组织级屏蔽。

## 控制台

- **卡片**:头像、名称、「官方」与「推荐」徽标、简介、标签(悬停看说明)、👍 数、下载量;官方标签排在最前。
- **标签颜色**:作者标签中性色;警示标签(unsafe、sensitive-data、unofficial-api)红色,提示标签(internal-state)黄色。这两种颜色不跟配色方案走,只分明暗两档,因为各配色方案的 `--warn` 不全是黄色。选中的筛选标签用实心填充并排到最前。
- **市场顶部**:「推荐」一行,下面是标签筛选条;排序加「推荐」「评分」。
- **详情抽屉**:两栏。左栏是简介、标签、官方标注与理由、截图、紧凑的信息表与历史版本;右栏是 giscus 评论区。窄屏叠成一栏。
- **安装确认**:有官方警示标签时列出标签、悬停说明与 `note`。
- 列表仍以 npm 搜索结果为底,用 `catalog.json` 补全;刚发布、Action 还没扫到的包也能出现。

## 给作者的指引

- `TAGS.md`:词表、怎么选、每个标签的现有例子。
- Cortico `templates/extension/*/package.json` 的 `cortico` 块预留 `"tags": []`;模板 README「发布前」一节链到 TAGS.md。
- Cortico `docs/extensions.md` 的 manifest 字段说明加 `tags`、`locales`、`screenshots`,链到 TAGS.md,不复制词表。
- `pnpm check:extension` 从 raw 读词表:标签为空时列出整张词表与 `when`;不认识的标签给出接近的几个;写了官方标签时提示无效;连不上时跳过并说明。

## 分期

1. **本仓库上线**:`index.json`、`TAGS.md`、扫 npm 生成 `catalog.json` 与 `assets/` 的 Action。
2. **Cortico 控制台**:读索引、标签与推荐、拉黑、官方标签、截图与 README、`check:extension`、模板与文档链接。
3. **评论评分**:开 Discussions 与分类、Action 开帖并统计、详情嵌 giscus、按评分排序。

## 未实测 / 待定

- Action 自带的 `GITHUB_TOKEN` 能否在 Announcement 分类开帖;不行就用 bot 账号的令牌。
- giscus 在控制台的 hash 路由下,GitHub 授权后能否正确跳回;授权会话是否按端口分开存。
- Action 的运行周期(Joplin 是 30 分钟)。
- 仓库名与 GitHub 上建仓:待操作员确认。
