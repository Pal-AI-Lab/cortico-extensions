// 按 index.json 生成 TAGS.md:词表的唯一来源是 index.json,TAGS.md 不手改。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const index = JSON.parse(readFileSync(`${root}index.json`, 'utf8'));
const EXAMPLES = 4;

const examples = (id) => Object.entries(index.overrides)
  .filter(([, o]) => o.addTags?.includes(id))
  .map(([name]) => `\`${name}\``);

const row = (id, t) => {
  const ex = examples(id);
  const shown = ex.slice(0, EXAMPLES).join(' ') + (ex.length > EXAMPLES ? ` 等 ${ex.length} 个` : '');
  return `| \`${id}\` | ${t.label.zh} / ${t.label.en} | ${t.when.zh}<br>${t.when.en} | ${t.hint.zh}<br>${t.hint.en} | ${shown || '—'} |`;
};

const entries = Object.entries(index.tags);
const author = entries.filter(([, t]) => !t.officialOnly);
const official = entries.filter(([, t]) => t.officialOnly);
const head = '| id | 名称 | 什么时候用 / When to use | 悬停说明 / Hover hint | 现有例子 |\n|---|---|---|---|---|';

const md = `<!-- 由 scripts/render-tags.mjs 按 index.json 生成,不要手改。 -->

# Cortico 扩展标签 / Extension tags

扩展在 package.json 的 \`cortico.tags\` 里从下表选所有贴切的标签,控制台市场按它分类和筛选,鼠标悬停时显示「悬停说明」。
Pick every tag below that fits for \`cortico.tags\` in package.json; the console market groups and filters by them and shows the hover hint.

\`\`\`jsonc
"cortico": { "kind": "world", "api": 5, "tags": ["im", "qq", "companion"] }
\`\`\`

## 怎么选 / How to choose

- 按扩展**接入什么、给 bot 什么能力**选,不按实现手段选。只调 HTTP 接口不算 \`browser\`,接了 QQ 就是 \`qq\`。
  Choose by **what the extension connects to and what it lets the bot do**, not by how it is built.
- 依附于另一个扩展的功能包,带上宿主所在的平台标签(QQ 功能包带 \`qq\`)。
  An add-on pack for another extension carries its host's platform tag (QQ add-ons carry \`qq\`).
- 只贴确实贴切的,不为多出现在几个筛选里多贴。\`apps\` 只在其他标签都不适用时用;一个都不贴切就留空,官方会修正。
  Tag only what truly fits, not to appear in more filters. Use \`apps\` only when no other tag fits; if nothing fits, leave it empty and maintainers will correct tags.
- 只能在某些系统上跑,写 npm 标准字段 \`"os": ["win32"]\`,不用标签表达。
  Platform limits go in the standard npm \`"os"\` field, not in tags.
- 写完跑 \`pnpm check:extension <包目录>\`,不在词表里的标签会被指出。
  Run \`pnpm check:extension <dir>\` afterwards; tags outside this list are reported.

## 作者可选 / Author tags

${head}
${author.map(([id, t]) => row(id, t)).join('\n')}

## 官方标签 / Official tags

下面这些标签由官方审查后添加:\`internal-state\` 显示为提示色,其余显示为警示色。作者写进 \`cortico.tags\` 也会被忽略,作者也去不掉。
没有这些标签只表示还没审查到,不代表安全。
These are added by maintainers after review; \`internal-state\` is shown as a notice, the rest as warnings. Authors cannot add or remove them.
Their absence means "not reviewed yet", not "safe".

${head}
${official.map(([id, t]) => row(id, t)).join('\n')}

## 新增标签 / Proposing a tag

至少 3 个已发布的扩展会用到时,给本仓库提 PR 改 \`index.json\`,名称与说明给中英两种。
Open a PR against \`index.json\` once at least 3 published extensions would use the tag; give labels and texts in Chinese and English.
`;

writeFileSync(`${root}TAGS.md`, md);
console.log(`TAGS.md: ${author.length} author tags, ${official.length} official tags`);
