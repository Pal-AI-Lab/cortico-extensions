# cortico-extensions

Cortico WebUI 扩展市场的官方索引。扩展本身仍发布在 npm;这里只放官方维护的分类、认证与覆盖项。
The official index for the Cortico WebUI extension market. Extensions are still published on npm; this repository holds the categories, certifications and overrides maintained by the Cortico team.

## 我要… / I want to…

| 我要 | I want to | 怎么做 / How |
|---|---|---|
| 给自己的包选标签 | Tag my package | 读 [TAGS.md](TAGS.md),写进 package.json 的 `cortico.tags`,发新版本 / Read [TAGS.md](TAGS.md), list tags in `cortico.tags`, publish a new version |
| 去掉官方加的标签、撤销警示标签 | Remove a maintainer tag or withdraw a warning tag | `[tags] 包名` |
| 为第三方包申请认证(要求与材料见 [DESIGN.md](DESIGN.md#扩展申请)) | Apply for certification of a third-party package (requirements in DESIGN.md) | `[certify] 包名` |
| 说明旧包已被新包取代 | Mark an old package as superseded | 先 / first `npm deprecate 旧包 "改用 新包"`,再 / then `[supersede] 旧包名` |
| 包被拉黑了要申诉 | Appeal a block | `[appeal] 包名` |
| 举报恶意代码或冒名 | Report malicious code or impersonation | `[report] 包名` |
| 提议新增标签 | Propose a new tag | `[new-tag] 标签 id`,或直接提 PR 改 `index.json` / or a PR against `index.json` |
| 以上都不是 | Anything else | `[other] 包名` |
| 刚发布了新包或新版本,让市场马上收录 | Get a package or release I just published into the market now | `[sync] 包名`,Action 马上同步,回帖后自动关闭 / an Action syncs right away, replies and closes the issue |

表里是 issue 标题。中文前缀同样认:`[标签]`、`[认证]`、`[取代]`、`[申诉]`、`[举报]`、`[新标签]`、`[其他]`、`[同步]`。正文一行一项 `键: 值`,用不到的不写。
The table gives the issue title. Chinese prefixes work too. The body is one `key: value` per line; leave out keys you do not need.

| 键 / Key | 用途 / Meaning |
|---|---|
| `package` / `包名` | 包名;`[sync]` 可以写几个,空格或换行分开 / package name; `[sync]` takes several, separated by spaces or new lines |
| `add` / `加` | 要加的标签 id / tag ids to add |
| `remove` / `去` | 要去的标签 id / tag ids to remove |
| `by` / `新包` | 取代旧包的新包 / the package that supersedes it |
| `reason` / `理由` | 一两句理由 / a sentence or two |
| `evidence` / `证据` | 链接 / links (source lines, npm page, screenshots) |

```bash
gh issue create -R Pal-AI-Lab/cortico-extensions --title "[tags] cortico-world-xxx" --body $'package: cortico-world-xxx\nremove: unsafe\nreason: Reads local files only; runs no outside code.\nevidence: https://...'
gh issue create -R Pal-AI-Lab/cortico-extensions --title "[sync] cortico-world-xxx" --body ""
```

网页上的 New issue 里每种类型各有一个表单,填出来是同一种格式。Action 会贴上类型 label、回帖列出这个包现在的标签与来源;缺项时贴 `needs-info` 并说明缺了什么,编辑 issue 补上即可。
On the web, New issue has a form for each type that produces the same format. An Action labels the issue by type and replies with the package's current tags and where they come from. When something is missing it adds `needs-info` and says what; edit the issue to fix it.

## 不收录的扩展 / Not accepted

功能或附带内容属于下列任何一类的扩展,一进市场就拉黑,事先不警告。同一作者因同一类被拉黑两次,其 npm 与 GitHub 账号永久拉黑,发布的所有包都不再出现。
An extension whose features or bundled content fall into any category below is blocked as soon as it reaches the market, with no warning first. An author blocked twice for the same category has their npm and GitHub accounts blocked permanently, which removes every package they publish.

1. 模型越狱 / 破甲:让模型绕过服务商安全规则的提示词、人设或工具。/ Model jailbreaks: prompts, personas or tooling meant to get a model past its provider's safety rules.
2. NSFW:色情内容,或生成色情内容的功能。/ NSFW: sexual content, or features for generating it.
3. 网络攻击与逆向工程:让 bot 扫描或攻击系统、编写或运行漏洞利用与恶意代码、破解授权或 DRM、脱壳与反编译软件。/ Security attacks and reverse engineering: letting the bot scan or attack systems, write or run exploits or malware, crack license checks or DRM, or unpack and decompile software.
4. 追踪第三方隐私:收集、关联或留存用户以外特定个人的信息,用来画像、定位或监视,例如人肉、跨平台关联账号、暗中记录他人聊天。bot 为自己的对话保留的聊天上下文与记忆不算。/ Tracking third parties: collecting, linking or keeping personal information about specific people other than the user, to profile, locate or monitor them, such as doxxing, matching someone's accounts across platforms, or covertly logging their chats. The chat context and memories a bot keeps for its own conversations do not count.
5. 恶意代码与冒名:偷取凭证、挖矿、后门、瞒着用户往外发数据,或冒充 Pal AI Lab、Cortico、Coopanion。/ Malicious code and impersonation: stealing credentials, mining, backdoors, sending data out without telling the user, or posing as Pal AI Lab, Cortico or Coopanion.
6. 联网多人游戏外挂:读写游戏内存、注入代码或篡改流量,对其他玩家取得不公平优势。/ Cheats for online multiplayer games: reading or writing game memory, injecting code or tampering with traffic to gain an unfair edge over other players.
7. 群发与刷量:批量私信、刷赞刷播放刷关注、批量养号。/ Spam and bulk automation: mass messaging, fake likes, views or follows, or running batches of accounts.
8. 违反中国法律的内容:涉政、赌博、诈骗。/ Content illegal in China: political content, gambling, fraud.

## 评论与喜欢 / Comments and likes

每个扩展在 [Discussions 的 Extensions 分类](https://github.com/Pal-AI-Lab/cortico-extensions/discussions/categories/extensions)里有一帖,标题是包名,由 Action 开帖。回复就是评论;对首楼点 👍 / 👎 就是喜欢 / 不喜欢。Cortico WebUI 的扩展详情里也能直接投票和评论。
Each extension has a thread, titled with the package name, in the [Extensions discussion category](https://github.com/Pal-AI-Lab/cortico-extensions/discussions/categories/extensions); an Action opens them. Replies are comments, and a 👍 or 👎 on the first post is a like or dislike. You can also vote and comment from the extension details in the Cortico WebUI.

## 文件 / Files

- `index.json`:标签词表、认证列表、新品天数、拉黑名单、对单个包的覆盖项。改动走 PR。/ Tag vocabulary, certified list, new-badge window, block list and per-package overrides. Changes go through PRs.
- `TAGS.md`:给扩展作者的 coding agent 看的标签说明(英文),由 `node scripts/render-tags.mjs` 按 `index.json` 生成。/ Tag guide for extension authors' coding agents, generated from `index.json`.
- `catalog.json`:每个包的列表信息(标签、官方、新品、下载量、讨论帖统计等)与警示标签粘住名单。由 Action 定时生成(GitHub 的定时任务常推迟,急的话开 `[sync]` issue),不手改。/ Per-package listing data (tags, official, new, downloads, thread stats, etc.) and the sticky warning-tag list. Generated by an Action on a schedule (GitHub often runs it late; open a `[sync]` issue when you need it now); do not edit.
- `packages/`、`assets/`:每个包的完整自描述与按版本切好的更新日志,以及从 npm 包里取出的图标与截图。由 Action 生成。/ Each package's full self-description, changelog split by version, and the icon and screenshots taken from the npm package. Generated by the Action.
- `comments/`:每个讨论帖的评论快照,给没登录 GitHub 的 WebUI 读。由 Action 生成;没有评论的包没有文件。/ Comment snapshots of each thread, read by WebUIs not signed in to GitHub. Generated by the Action; packages without comments have no file.
- 作用域包的文件名把 `/` 换成 `__`:`@scope/name` → `@scope__name.json`。/ Scoped package files replace `/` with `__`: `@scope/name` → `@scope__name.json`.
- `scripts/`、`.github/workflows/`:生成上面这些文件、开讨论帖、处理扩展申请的脚本。/ The scripts and workflows that generate those files, open threads and handle requests.
- `DESIGN.md`:市场升级的整体设计与文件格式(中文,内部)。/ The overall design and file formats, in Chinese, for maintainers.
