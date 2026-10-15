# cortico-extensions

Cortico 控制台扩展市场的官方索引。扩展本身仍发布在 npm;这里只放官方维护的分类、认证与覆盖项。
The official index for the Cortico console extension market. Extensions are still published on npm; this repository holds the categories, certifications and overrides maintained by the Cortico team.

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

表里是 issue 标题。中文前缀同样认:`[标签]`、`[认证]`、`[取代]`、`[申诉]`、`[举报]`、`[新标签]`、`[其他]`。正文一行一项 `键: 值`,用不到的不写。
The table gives the issue title. Chinese prefixes work too. The body is one `key: value` per line; leave out keys you do not need.

| 键 / Key | 用途 / Meaning |
|---|---|
| `package` / `包名` | 包名 / package name |
| `add` / `加` | 要加的标签 id / tag ids to add |
| `remove` / `去` | 要去的标签 id / tag ids to remove |
| `by` / `新包` | 取代旧包的新包 / the package that supersedes it |
| `reason` / `理由` | 一两句理由 / a sentence or two |
| `evidence` / `证据` | 链接 / links (source lines, npm page, screenshots) |

```bash
gh issue create -R Pal-AI-Lab/cortico-extensions --title "[tags] cortico-world-xxx" --body $'package: cortico-world-xxx\nremove: unsafe\nreason: Reads local files only; runs no outside code.\nevidence: https://...'
```

## 文件 / Files

- `index.json`:标签词表、认证列表、新品天数、拉黑名单、对单个包的覆盖项。改动走 PR。/ Tag vocabulary, certified list, new-badge window, block list and per-package overrides. Changes go through PRs.
- `TAGS.md`:给扩展作者的 coding agent 看的标签说明(英文),由 `node scripts/render-tags.mjs` 按 `index.json` 生成。/ Tag guide for extension authors' coding agents, generated from `index.json`.
- `DESIGN.md`:市场升级的整体设计(中文,内部)。/ The overall design, in Chinese, for maintainers.
