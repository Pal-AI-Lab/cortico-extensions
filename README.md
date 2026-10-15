# cortico-extensions

Cortico 控制台扩展市场的官方索引。扩展本身仍发布在 npm;这里只放官方维护的分类、推荐与覆盖项。

## 我要… / I want to…

| 我要 | 怎么做 |
|---|---|
| 给自己的包选标签 | 读 [TAGS.md](TAGS.md),写进 package.json 的 `cortico.tags`,发新版本 |
| 去掉官方加的标签、撤销警示标签 | 提 issue,标题 `[标签] 包名` |
| 自荐或推荐一个第三方包 | 提 issue,标题 `[推荐] 包名` |
| 说明旧包已被新包取代 | 先 `npm deprecate 旧包 "改用 新包"`,再提 issue,标题 `[取代] 旧包名` |
| 包被拉黑了要申诉 | 提 issue,标题 `[申诉] 包名` |
| 举报恶意代码或冒名 | 提 issue,标题 `[举报] 包名` |
| 提议新增标签 | 提 issue,标题 `[新标签] 标签 id`,或直接提 PR 改 `index.json` |

正文一行一项 `键: 值`,用不到的不写。命令行可以直接发:

```bash
gh issue create -R Pal-AI-Lab/cortico-extensions --title "[标签] cortico-world-xxx" --body $'包名: cortico-world-xxx\n去: unsafe\n理由: 只读本地文件,不执行外部代码\n证据: https://...'
```

可用的键:`包名`/`package`、`加`/`add`、`去`/`remove`、`新包`/`by`、`理由`/`reason`、`证据`/`evidence`。标题前缀也认英文:`[tags]`、`[feature]`、`[supersede]`、`[appeal]`、`[report]`、`[new-tag]`。

## 文件 / Files

- `index.json`:标签词表、推荐列表、拉黑名单、对单个包的覆盖项。改动走 PR。
- `TAGS.md`:给扩展作者(和他们的 coding agent)看的标签说明,由 `node scripts/render-tags.mjs` 按 `index.json` 生成。
- `DESIGN.md`:市场升级的整体设计草案。
