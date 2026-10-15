# Cortico 扩展市场升级:设计

状态:控制台前端已在 Cortico 分支 `feat/extension-market-index` 上实现(本地,未推);服务端只做了历史版本兼容性,其余未做;本仓库在本地,尚未推到 GitHub。

- GitHub 仓库名定为 `Pal-AI-Lab/cortico-extensions`(本地目录仍叫 cortico-extension-index)。
- 全部改动攒到 Cortico 0.2.0 一起发,world / provider / bot 三类契约版本各加一。

## 目标与约束

- 控制台扩展市场加上:标签分类、官方与推荐、拉黑、提示与警示标注、喜欢 / 不喜欢与评论。
- 扩展照旧发布在 npm、从 npm 安装。
- 不自建服务。市场数据放 GitHub,假定下游开发者连得上 GitHub。
- 市场新增的文字只做中文和英文;控制台其他界面语言下显示英文。
- GitHub 连不上时,市场退回纯 npm(搜索结果 + 下载量),安装不受影响。

## 组成

| 部分 | 位置 | 谁写 | 内容 |
|---|---|---|---|
| 扩展包 | npm | 作者 | 代码、package.json(含 `cortico` 块)、README |
| `index.json` | 本仓库 | 官方,走 PR | 标签词表、官方账号与名字、推荐、拉黑、对单个包的覆盖 |
| `catalog.json` | 本仓库 | Action 定时生成 | 每个包的汇总信息、作者声明的标签、粘住名单、下载量、讨论帖统计、按版本切好的更新日志 |
| `assets/` | 本仓库 | Action 定时生成 | 从 npm 包里解压出的图标和截图 |
| `comments/` | 本仓库 | Action 定时生成 | 每个包讨论帖的评论快照,没登录 GitHub 的控制台读它 |
| `TAGS.md` | 本仓库 | `scripts/render-tags.mjs` 按 `index.json` 生成 | 给作者和 coding agent 看的标签说明 |
| Discussions | 本仓库 | 用户 | 每个包一帖:回复是评论,首楼 reaction 是喜欢 / 不喜欢 |
| Issues | 本仓库 | 任何人 | 标签申请、新增标签提案(issue 表单) |
| GitHub App「Cortico 扩展市场」 | GitHub | 官方建 | 只有 Discussions 读写权限,只装在本仓库;控制台用它代用户投票、读写评论 |
| 控制台 | Cortico | | 服务端读索引并合进搜索结果;页面见「控制台」 |

控制台读 `raw.githubusercontent.com` 上的 `index.json` 与 `catalog.json`,不调 GitHub API(匿名每 IP 每小时 60 次)。raw 文件有 5 分钟 CDN 缓存。

## 每个扩展的信息

| 来源 | 信息 |
|---|---|
| 作者(package.json 与包内文件) | 包名、版本、简介、author、许可证、主页 / 仓库 / 问题链接、`engines`、依赖、`os`、`funding`、README、`CHANGELOG.md` |
| 作者(`cortico` 块) | `kind`、`api`、`displayName`、`icon`、面板产物;新增 `tags`、`locales`、`screenshots` |
| 官方(`index.json`) | 是否推荐、是否拉黑、增删标签及理由(`note`)、「已被 X 取代」 |
| Action(`catalog.json`) | 上面作者字段的汇总、npm 维护者、是否官方、作者声明的标签、粘住名单、图标与截图地址、下载量(累计 / 30 天 / 7 天)、讨论帖编号、喜欢 / 不喜欢 / 评论数 |
| 控制台现场算 | 已装、待重启、有更新、契约兼容(当前版本与每个历史版本) |

作者侧新增字段全部可选,随 0.2.0 一起发:

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

## 更新日志

不加字段,读包根目录的 `CHANGELOG.md`,可选。

- **格式**:每个版本一个二级标题,标题里第一个版本号就是这一段的版本,如 `## 0.1.2` 或 `## [0.1.2] - 2026-10-15`(Keep a Changelog 与 changesets 默认的写法)。
- **抽取**:Action 解包时按版本切段写进 `catalog.json` 的 `changelog: { versions: { "0.1.2": "..." }, url }`;每段截到 2000 字;`url` 指向完整文件(有仓库地址用仓库里的,没有用 unpkg)。控制台不执行包里的代码。
- **显示**:不上卡片。详情「历史版本」下拉里写了说明的版本号可点开,说明用简介同一个 Markdown 子集渲染;外链一排末尾「更新日志」;已安装卡片有更新时多一个「更新说明」,打开后列出已装版本到最新版之间各版,新的在前。没写的版本那一行照旧,不写「作者未提供」。
- **指引**:作者说明与模板 README「发布前」各一句;`check:extension` 发现当前版本在 CHANGELOG.md 里没有对应标题时提示,不拦发布。

`locales` 只认 `zh` 与 `en`,写了的语言覆盖顶层的 `displayName` 与 `description`。只能在某些系统上跑用 npm 标准字段 `os`(如 `["win32"]`,排除用 `"!darwin"`),控制台按它标出平台、在不支持的系统上禁用安装。

## 扩展自描述(Cortico 0.2.0)

0.2.0 起三类扩展都要导出自描述,三类契约版本随 0.2.0 各加一。

- **数据源**:声明写在 Definition 的静态字段里,运行时用的是同一份。发布前跑 `pnpm describe:extension`,用干装载把声明导出成包里的 `describe.json`,manifest 写它的路径;`check:extension` 检查文件与代码当前的声明一致。Action 与控制台只读这个文件,不执行扩展代码。
- **World**:
  - `tools`:全部工具,每个有 `name`、`description`(给模型)、`parameters`、`tags`,可选 `summary`(给人看的一句话)。实例的 `tools()` 只能返回其中的子集,可以按配置改描述;Core 挂载时检查工具名都在声明里。
  - `events`:会推出的事件,每个有 `type`、`description`(必填,给人看的一句话)、默认投递方式与标签。推出没声明的事件照常投递,记进运行日志并在 World 页标出。
  - 声明只给人和市场看,不进提示词;环境说明仍走 envPrompt 模板。
- **Provider**:接入的协议、登录方式(API Key / OAuth / 设备码 / 网页登录态)、是否在本机跑模型、支持的输入(文本 / 图片 / 音频 / 视频);现有的 `title`、`description`、档位表一起导出。
- **Bot**:默认启用的 World(`declares`)、Persona 提供的工具(同 World 工具的写法)、Memory 的名字与形式。
- **市场展示**:卡片上一行能力摘要(World 是工具与事件数;供应商是协议、登录方式与输入;Bot 是 World 数与 Memory),没有自描述的包这一行留空占位;详情左栏的第二个选项卡「工具与事件」(供应商是「接入方式」,Bot 是「组成」)。工具先显示 `summary`,没有就取 `description` 的第一句,点开看完整的给模型描述;事件超过 8 种先列 8 种。

## 标签

词表与每个标签的用法见 [TAGS.md](TAGS.md)。每个标签有两段文字:`when` 给作者与 agent 判断该不该贴,`hint` 是用户悬停看到的说明。

**三级,级别只看词表里的 `style`:**

| 级别 | 标签 | 作者 | 官方 |
|---|---|---|---|
| 普通(灰色) | 即时通讯、QQ、直播、游戏、联网、浏览器、视频、语音、电脑操作、现实环境、应用程序、记忆、陪伴、创作、诊断、本地模型、需额外安装、需要密钥 | 可加可去 | 可加可去 |
| 提示(黄色) | 实验性、内部状态、依赖其他扩展、高消耗 | 可加;自己加的可去,官方加的去不掉 | 可加可去 |
| 警示(红色) | 不安全、读取隐私、非官方接口 | 可加;任一版本声明过就记入粘住名单,作者去不掉 | 可加可去 |

- 一个包的标签 = 作者当前版本 `cortico.tags` 中词表内的标签 ∪ `keywords` 中属于词表的词 ∪ 粘住名单里的警示标签 ∪ 官方 `addTags` − 官方 `removeTags`。官方的去优先。
- 粘住名单由 Action 写在 `catalog.json`,扫描时只增不减;只有官方 `removeTags` 能撤销。
- 不设数量上限。应用程序只在其他标签都不适用时用;依赖其他扩展不打给 Bot 扩展。
- 需要密钥:用户要自己申请第三方账号或 API Key(搜索、生图接口等);模型端点的密钥不算。实验性:作者自己标明还在测试,不按版本号自动判断。
- 高消耗靠作者自己声明;用户在「标签申请」里反馈、或官方自己发现时,官方用 `addTags` 加。
- 记忆、陪伴的说明带一句:不推荐通过 World 管理记忆和任何内部状态,请写 Bot 扩展。诊断的说明带一句:如无必要不推荐通过 World 做,请发布单独的工具。
- 新增词表标签:至少 3 个已发布的扩展会用到时,提 PR 改 `index.json`,名称与说明给中英两种。
- 黄色与红色是扩展页自己的固定色,只分明暗两档,不跟控制台配色方案走:各配色方案的 `--warn` 不全是黄色。
- 排序各处一致:普通、黄色、红色,组内按词表顺序(标签条里按出现次数)。

## 官方管理(`index.json`)

```jsonc
{
  "official": { "maintainers": ["phantivia"], "names": ["Pal AI Lab", "Cortico", "Coopanion"] },
  "tags": { "...": "见 TAGS.md" },
  "featured": ["cortico-world-bilibili"],
  "blocked": {
    "packages": { "cortico-world-xxx": "原因" },
    "publishers": { "some-npm-user": "原因" }
  },
  "overrides": {
    "cortico-world-python": {
      "addTags": ["unsafe"],
      "removeTags": [],
      "note": { "zh": "运行任意 Python 插件代码", "en": "Runs arbitrary Python plugin code" },
      "supersededBy": "另一个包名"
    }
  }
}
```

- **官方**:npm 维护者里有 `official.maintainers` 列出的账号就算官方(现在 phantivia,14 个包)。按维护者判断,不按发布者:用 GitHub Actions 发布的包,发布者都显示为 GitHub Actions。
- **推荐**:`featured` 里的包名,没有推荐语;排序「按推荐」按列表顺序排在前面。
- **冒名排查**:author 谁都能写,npm 账号只有本人能用。Action 把 author 或 displayName 里带 `official.names`、但维护者不在 `official.maintainers` 里的包列出来,官方人工看,确认冒名就拉黑。
- **拉黑**:被拉黑的包,或被拉黑的 npm 发布者发的所有包,不在市场里出现。手动按包名安装时提示拉黑原因,但不拦。已装的不隐藏,在已安装卡片上标红写出原因。控制台把最近一次读到的 `index.json` 缓存在扩展目录里,连不上 GitHub 时继续按缓存拦。
- **`note`**:官方说明这个包为什么带某个标签,显示在安装确认里。
- **`supersededBy`**:这个包已被另一个包取代(如 `cortico-world-qq-final-beta` → `cortico-world-qq-final`)。详情里安装按钮下写「已被 X 取代」,X 点开新包的详情。

## 标签申请

- 作者改自己的普通标签与自己声明的提示标签,发新版本即可,不用申请。
- 要去掉官方加的标签,或撤销声明过的警示标签,在本仓库用「标签申请」issue 表单:包名、要加的、要去的、理由、证据。谁都能提(用户也可以报),官方审核后改 `index.json`,PR 关联 issue,结论回在 issue。
- Action 给新 issue 贴出这个包现在的标签与来源。
- 新增词表标签用另一张「新增标签提案」表单。
- 入口:TAGS.md 一节;`check:extension` 发现官方改过这个包的标签时附申请链接;控制台详情的标签行加「反馈标签」链接,打开预填包名的表单(待做)。

## 喜欢 / 不喜欢与评论

- 本仓库开 Discussions,建一个 Announcement 格式的分类:只有维护者能开帖,任何人能回复。Action 发现 npm 上有新包就开帖,标题是包名。
- 喜欢 / 不喜欢是首楼的两种 reaction,评论是帖子回复。
- **投票和评论都走 GitHub App**:用户第一次投票或评论时,控制台走设备码登录(github.com/login/device),由本机 Cortico 服务端完成,不需要服务器和 client secret。令牌只能动装了这个 App 的仓库,存在本机扩展目录的 `github-token.json`,Cortico 的 `.gitignore` 单列了这个文件名。服务端代用户调 GraphQL 加 / 撤 reaction、读写回复。
- **接口**(都在本机服务端,要账号的接口没登录时回 428,控制台先弹登录、登上后重发一次):
  - `GET /api/extensions/github`:本机登录的账号 `{ login?, avatar? }`。
  - `POST /api/extensions/github/login`:向 GitHub 要设备码,回 `{ userCode, verificationUri, expiresIn, interval }`,服务端在后台等授权;控制台按 `interval` 问 `GET /api/extensions/github` 直到登上或过期。
  - `POST /api/extensions/github/logout`:删掉本机令牌。
  - `POST /api/extensions/vote { name, vote: "up" | "down" | null }`:回应带最新的 up / down / comments 与本机账号的 `mine`。
  - `GET /api/extensions/comments?name=&cursor=`:一页评论(新的在前),`{ comments: [{ id, author, avatar?, body, createdAt }], total, next?, discussion? }`。读也走服务端:登录了用本机令牌实时读;没登录读 Action 定时写进本仓库的 `comments/<包名>.json` 快照(走 raw,不占 API 额度,晚一个扫描周期)。App 私钥不随 Cortico 分发。
  - `POST /api/extensions/comments { name, body }`:发一条回复,回应是这条评论。帖子只由 Action 开(分类是 Announcement 格式,用户令牌开不了帖);Action 还没扫到的新包回 409,控制台把原因写在输入框下。
- **一人一票**:同一账号对同一帖的同种 reaction,GitHub 只记一次;喜欢和不喜欢二选一由控制台保证(改票先撤旧的)。绕过控制台两种都点的账号,Action 统计时算作不投票。
- 卡片上的数字和「按评分排序」用 `catalog.json` 里 Action 取好的数;投票后用服务端回的实时数。
- **评论区在控制台里自己渲染**,不用 giscus:输入框(支持 Markdown)、账号位(登录了显示头像、账号与退出,没登录是「登录 GitHub」按钮)、发表;列表新的在前,一次 5 条,「加载更多」;底下「在 GitHub 上查看讨论」。评论正文用和简介同一个 Markdown 子集渲染。
- **登录弹窗**:显示登录码与复制按钮、「打开 GitHub」,下面一行等待状态;登上自动关闭,过期提示重新登录。
- 审核用 GitHub 自带的隐藏、删除、锁帖与组织级屏蔽。

## 控制台

列表以 npm 搜索结果为底,用 `catalog.json` 补全;刚发布、Action 还没扫到的包也能出现。

- **分页标签**:World 扩展、供应商扩展、Bot 模板,带与左栏对应页面同一个图标,下面一行说明;窄屏只留图标和名称。
- **已安装**:标题后一行小字「安装位置」;卡片比市场卡片紧凑;World 分页提示「在左侧的 World 总览页面加载或停用 World」;被拉黑的标红。
- **搜索区**:
  - 工具条:搜索、排序(推荐 / 名字 / 最近发布 / 下载量 / 评分)、每页显示、清除筛选、刷新。
  - 高级搜索展开时是工具条下面一行:作者(author、发布者或维护者)、关键字、许可证、发布时间、近 30 天下载下限。
  - 开关行:高级搜索、npm 源(下拉,内含输入框、保存与说明);右边隐藏已安装、隐藏带警示标签的扩展。
  - 标签条:「官方」开关在最前,然后是选中的标签,其余按普通、黄色、红色分组,组内按出现次数;选中的实心填充。
  - 清除筛选清搜索词、标签、官方与高级搜索,不动两个隐藏开关。
- **卡片**:
  - 页头固定两行:标题一行(过长截断);第二行 author 与版本,后跟「官方」「推荐」徽标,末尾是平台标记(包写了 `os` 时:「仅 Windows」或「不支持 macOS」,本机不支持时红色)。没填 author 时显示 `npm@账号`。
  - 右上角近 30 天下载量。
  - 简介两行、标签。
  - 底部一排:喜欢、不喜欢(主题色上下三角,点了直接投,再点撤回,投过的常亮)、评论数(点开详情并滚到评论区)、最近更新(最新版本发布日期,今年只写月-日,靠右)。
  - 许可证不上卡片。
- **悬停**:标签、「官方」「推荐」、author(显示 `npm: @账号`)、下载量(累计 / 30 天 / 7 天)、日期(完整日期)有悬停;标题、喜欢、不喜欢、评论数没有。浮层宽 200–360px,多行排版。
- **详情**:
  - 页头:64px 头像、名称、`包名@版本`、徽标;右边安装按钮,当前版本不兼容或本机系统不在 `os` 里时禁用,原因写在按钮下;官方标了取代的写「已被 X 取代」;再下面是「历史版本」下拉,每个版本按自己的 manifest 判断兼容,不兼容的显示「不兼容」并禁用,原因写在那一行下。
  - 信息表有「平台」一行:没写 `os` 是「不限」。
  - 下面一排外链:npm 包页面、源代码仓库、项目主页、问题反馈、更新日志,各带图标,悬停显示地址。
  - 「历史版本」里写了更新说明的版本号是可点开的链接色,点开在那一行下显示说明。
  - 两栏:左栏顶部是「扩展信息 / 工具与事件」选项卡,默认扩展信息(简介按 Markdown 渲染、标签、截图、信息表),没有自描述的包不出选项卡;右栏评论区与喜欢 / 不喜欢 / 评论数。窄屏叠成一栏;内置扩展没有评论区。
  - 简介的 Markdown 只渲染段落、标题、列表、代码块、粗体、斜体、行内代码与 http(s) 链接,原始 HTML 当文字显示。
- **安装确认**:带红色警示标签时列出标签、说明与官方说明,确认才装。

## 给作者的指引

- `TAGS.md`:三级规则、词表、怎么选、每个标签的现有例子、申请渠道。
- Cortico `templates/extension/*/package.json` 的 `cortico` 块预留 `"tags": []`;模板 README「发布前」一节链到 TAGS.md。
- Cortico `docs/extensions.md` 的 manifest 字段说明加 `tags`、`locales`、`screenshots`,链到 TAGS.md,不复制词表。
- 更新日志见「更新日志」一节:模板带一份只有当前版本标题的 `CHANGELOG.md`。
- `pnpm check:extension` 从 raw 读词表:标签为空时列出整张词表与 `when`;不认识的标签给出接近的几个;列出提示与警示标签,请作者对照声明;官方改过这个包的标签时附申请链接;连不上时跳过并说明。

## 进度与分期

1. **本仓库**:本地已有 `index.json`(25 个标签、58 个公开包的覆盖;deepseek 与 coo 两个供应商没有贴切的标签)、TAGS.md、本文档、生成脚本。待做:在 GitHub 建仓 `Pal-AI-Lab/cortico-extensions`;Action(扫 npm 生成 `catalog.json` 与 `assets/`、粘住名单、冒名排查、开帖与统计、评论快照 `comments/`、按版本切更新日志);两张 issue 表单。
2. **控制台前端**:已在分支上实现,本文「控制台」一节与评论区、登录弹窗、平台标记、取代提示、更新日志都已做,另有预览页。待做:「反馈标签」链接。
3. **控制台服务端**:已做历史版本兼容性;`/api/extensions` 已回 `platform`。待做:读 `index.json` / `catalog.json` 并合进搜索结果(标签、作者声明、官方、推荐、评分、图标、截图、author、维护者、说明、`os`、取代、更新日志)、过滤拉黑、缓存索引、投票与评论接口、设备码登录与令牌文件、`check:extension` 的标签检查、模板与文档。
4. **GitHub App**:建 App(打开 Device Flow)、开 Discussions 与分类。

## 待定 / 未实测

- 高消耗目前只打给 Minecraft,其他包没有实测数据。
- Action 自带的 `GITHUB_TOKEN` 能否在 Announcement 分类开帖;不行就用 bot 账号的令牌。
- GitHub App 的设备码登录要在 App 设置里打开 Device Flow,未实测。
- 评论快照 `comments/` 按包一个文件,包多了以后仓库提交会很频繁;可以只在评论数变了时重写那个文件。
- Action 的运行周期(Joplin 是 30 分钟)。
