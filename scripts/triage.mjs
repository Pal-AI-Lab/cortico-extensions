// 扩展申请:按标题前缀认出类型、贴 label,解析正文(纯文本 `键: 值` 与网页表单的 `### 标题` 两种),
// 回一条中英双语的说明,贴出这个包现在的标签与来源、是否已在 npm 上弃用。格式不对时说明缺了哪项,不关 issue。
// 同一个 issue 只维护一条回帖,编辑 issue 后更新那一条。令牌是 Action 的 GITHUB_TOKEN。
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { NPM_NAME, REPO, blockReason, certifyChecks, loadIndex, mergeTags, packument, readJson, rest, tagStyle } from './lib.mjs';

const MARKER = '<!-- cortico-extensions-triage -->';
const NEEDS_INFO = 'needs-info';

/** 类型 → 标题前缀(英文在前)、label、必填项。 */
export const TYPES = {
  tags: { prefixes: ['tags', '标签'], zh: '标签', required: ['package', 'change', 'reason'] },
  certify: { prefixes: ['certify', '认证'], zh: '认证', required: ['package'] },
  supersede: { prefixes: ['supersede', '取代'], zh: '取代', required: ['package', 'by'] },
  appeal: { prefixes: ['appeal', '申诉'], zh: '申诉', required: ['package', 'reason'] },
  report: { prefixes: ['report', '举报'], zh: '举报', required: ['package', 'reason'] },
  'new-tag': { prefixes: ['new-tag', '新标签'], zh: '新标签', required: ['tag', 'reason'] },
  other: { prefixes: ['other', '其他'], zh: '其他', required: [] },
  // 由 sync.yml 同步、回帖并关闭(sync-requests.mjs),这里只贴 label
  sync: { prefixes: ['sync', '同步'], zh: '同步', required: [] },
};

/** 正文的键,中英都认。 */
const KEYS = {
  package: ['package', '包名'],
  add: ['add', '加'],
  remove: ['remove', '去'],
  by: ['by', '新包'],
  reason: ['reason', '理由'],
  evidence: ['evidence', '证据'],
};

const FIELD_NAMES = {
  package: '包名 / `package`',
  change: '加或去 / `add` or `remove`',
  by: '新包 / `by`',
  reason: '理由 / `reason`',
  tag: '标题里的标签 id / tag id in the title',
};

const SOURCE_NAMES = {
  author: '作者声明 / declared by the author',
  keywords: '`keywords`',
  sticky: '警示标签粘住名单 / sticky warning list',
  added: '官方添加 / added by maintainers',
};

const LEVEL_NAMES = { official: '官方标注 / official mark', plain: '普通 / plain', notice: '提示 / notice', warning: '警示 / warning' };

const CHECK_NAMES = {
  versions: '发布过两个以上版本 / at least two published versions',
  tags: '有标签(供应商不要求)/ has tags (not required for providers)',
  description: '有简介 / has a description',
  'world-deps': 'World 不依赖其他 cortico-world-* 包 / a World does not depend on other `cortico-world-*` packages',
  'no-warning': '没有警示标签 / no warning tags',
  'not-blocked': '没被拉黑 / not blocked',
};

export function parseTitle(title) {
  const m = /^\s*[[【]\s*([^\]】]+?)\s*[\]】]\s*(.*)$/.exec(title ?? '');
  if (!m) return {};
  const word = m[1].toLowerCase();
  const type = Object.keys(TYPES).find((t) => TYPES[t].prefixes.includes(word));
  return { type, target: m[2].trim().split(/\s+/)[0] || undefined };
}

/** 纯文本一行一项 `键: 值`;网页表单是 `### 标题` 后面一段。两种可以混着出现。 */
export function parseBody(body) {
  const fields = {};
  const keyOf = (raw) => {
    // 表单标题形如「包名 / Package (`package`)」:中文名、英文说明、括号里的键名,任一段认得就行。
    const parts = raw.toLowerCase().replace(/[`*]/g, '').split(/[/()]/).map((s) => s.trim());
    return Object.keys(KEYS).find((k) => parts.some((p) => KEYS[k].includes(p)));
  };
  const text = (body ?? '').replace(/\r\n/g, '\n');
  for (const section of text.split(/^###\s+/m).slice(1)) {
    const [heading, ...rest] = section.split('\n');
    const key = keyOf(heading);
    const value = rest.join('\n').trim();
    if (key && value && value !== '_No response_') fields[key] = value;
  }
  for (const line of text.split('\n')) {
    const m = /^\s*([^:：#]{1,40}?)\s*[:：]\s*(\S.*)$/.exec(line);
    const key = m && keyOf(m[1]);
    if (key && !fields[key]) fields[key] = m[2].trim();
  }
  for (const k of ['add', 'remove']) if (fields[k]) fields[k] = fields[k].split(/[\s,，、]+/).filter(Boolean);
  // 同步请求可以一次写几个包;其他类型只用第一个
  if (fields.package) [fields.package] = fields.packages = fields.package.split(/[\s,，、]+/).filter(Boolean);
  if (fields.by) fields.by = fields.by.split(/\s+/)[0];
  return fields;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const repo = `/repos/${REPO.owner}/${REPO.name}`;
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const issue = event.issue ?? await rest(token, 'GET', `${repo}/issues/${process.env.ISSUE_NUMBER}`);
  if (!issue?.number || issue.pull_request) return;

  const reply = parseTitle(issue.title).type === 'sync' ? { type: 'sync' } : await compose(issue);
  if (reply.body) console.log(reply.body);

  const current = new Set(issue.labels.map((l) => (typeof l === 'string' ? l : l.name)));
  const wanted = new Set([...current].filter((l) => !TYPES[l] && l !== NEEDS_INFO));
  if (reply.type) wanted.add(reply.type);
  if (reply.needsInfo) wanted.add(NEEDS_INFO);
  if ([...wanted].sort().join() !== [...current].sort().join()) await rest(token, 'PUT', `${repo}/issues/${issue.number}/labels`, { labels: [...wanted] });
  if (!reply.body) return;

  const comments = await rest(token, 'GET', `${repo}/issues/${issue.number}/comments?per_page=100`);
  const mine = comments.find((c) => c.user?.type === 'Bot' && c.body?.includes(MARKER));
  if (mine) { if (mine.body !== reply.body) await rest(token, 'PATCH', `${repo}/issues/comments/${mine.id}`, { body: reply.body }); }
  else await rest(token, 'POST', `${repo}/issues/${issue.number}/comments`, { body: reply.body });
}

export async function compose(issue) {
  const index = loadIndex();
  const catalog = readJson('catalog.json', { packages: {} });
  const { type, target } = parseTitle(issue.title);
  const out = [MARKER];
  const problems = [];

  if (!type) {
    out.push(
      '标题没有认出的类型前缀。请把标题改成 `[类型] 包名`,类型见 [README](https://github.com/Pal-AI-Lab/cortico-extensions/blob/main/README.md):`[tags]`、`[certify]`、`[supersede]`、`[appeal]`、`[report]`、`[new-tag]`、`[other]`、`[sync]`,中文前缀 `[标签]`、`[认证]`、`[取代]`、`[申诉]`、`[举报]`、`[新标签]`、`[其他]`、`[同步]` 同样认。',
      '',
      'The title has no recognized type prefix. Please rename it to `[type] package-name`; the types are listed in the [README](https://github.com/Pal-AI-Lab/cortico-extensions/blob/main/README.md): `[tags]`, `[certify]`, `[supersede]`, `[appeal]`, `[report]`, `[new-tag]`, `[other]`, `[sync]` (Chinese prefixes work too).',
    );
    return { body: out.join('\n'), needsInfo: true };
  }

  const fields = parseBody(issue.body);
  const pkg = type === 'new-tag' ? undefined : fields.package ?? target;
  const tagId = type === 'new-tag' ? target : undefined;
  out.push(`类型:**${TYPES[type].zh}** / Type: **${type}**`, '');

  const have = { package: pkg, change: fields.add?.length || fields.remove?.length, by: fields.by, reason: fields.reason, tag: tagId };
  for (const f of TYPES[type].required) if (!have[f]) problems.push(`缺少 / Missing: ${FIELD_NAMES[f]}`);

  const unknown = [...(fields.add ?? []), ...(fields.remove ?? [])].filter((id) => !index.tags[id]);
  if (unknown.length) problems.push(`不在词表里的标签 / Tags not in the vocabulary: ${unknown.map((id) => `\`${id}\``).join(', ')}(见 / see [TAGS.md](https://github.com/Pal-AI-Lab/cortico-extensions/blob/main/TAGS.md))`);

  if (type === 'new-tag' && tagId) {
    if (index.tags[tagId]) problems.push(`\`${tagId}\` 已经在词表里 / is already in the vocabulary`);
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tagId)) problems.push(`标签 id 只用小写字母、数字和连字符 / A tag id uses lowercase letters, digits and hyphens only: \`${tagId}\``);
  }

  const info = [];
  if (pkg) {
    const doc = NPM_NAME.test(pkg) ? await packument(pkg) : undefined;
    const entry = catalog.packages[pkg];
    const publisherBlock = index.blocked?.publishers?.[pkg];
    if (!doc && publisherBlock) {
      info.push(`npm 账号 \`${pkg}\` 被拉黑 / The npm account \`${pkg}\` is blocked:${publisherBlock.zh} / ${publisherBlock.en}`);
    } else if (!doc && type === 'other' && !fields.package) {
      // [other] 的标题可以是一句概括,不当包名报错。
    } else if (!doc) {
      problems.push(`npm 上找不到 / Not found on npm: \`${pkg}\``);
    } else {
      info.push(...packageInfo(index, catalog, doc, entry));
      if (type === 'certify') {
        if (entry?.official) problems.push('官方的包不收认证,认证只给第三方包 / Official packages are not certified; certification is for third-party packages');
        info.push('', '自动核对(其余要求由官方人工看)/ Automatic checks (maintainers review the rest):', '');
        for (const c of certifyChecks(index, doc, entry)) info.push(`- ${c.ok ? '✅' : '❌'} ${CHECK_NAMES[c.id]}`);
      }
      if (type === 'supersede') {
        const deprecated = doc.versions?.[doc['dist-tags']?.latest]?.deprecated;
        if (!deprecated) problems.push(`旧包还没有在 npm 上弃用。请先运行 / The old package is not deprecated on npm yet. First run \`npm deprecate ${pkg} "use ${fields.by ?? 'NEW-PACKAGE'}"\``);
        if (fields.by && !(await packument(fields.by))) problems.push(`npm 上找不到新包 / The new package is not on npm: \`${fields.by}\``);
      }
    }
  }

  if (problems.length) {
    out.push('**需要补充 / Needs attention**', '', ...problems.map((p) => `- ${p}`), '', '改好后编辑这个 issue 即可,不用新开。/ Edit this issue once fixed; no need to open a new one.', '');
  }
  if (info.length) out.push(...info, '');
  out.push('官方看过后在这里回复。/ A maintainer will review this and reply here.');
  return { type, body: out.join('\n'), needsInfo: problems.length > 0 };
}

function packageInfo(index, catalog, doc, entry) {
  const name = doc.name;
  const lines = [`**[${name}](https://www.npmjs.com/package/${name})**`, ''];
  if (!entry) lines.push('这个包还不在市场索引里(下一次扫描会收进来,或者它没有 Cortico 扩展的关键字)。/ This package is not in the market catalog yet (the next scan picks it up, or it lacks a Cortico extension keyword).', '');
  else {
    const latest = doc.versions?.[doc['dist-tags']?.latest] ?? {};
    const declared = Array.isArray(latest.cortico?.tags) ? latest.cortico.tags : [];
    const sticky = catalog.sticky?.[name] ?? [];
    const merged = mergeTags(index, { declared, keywords: latest.keywords ?? [], sticky }, index.overrides?.[name]);
    if (merged.tags.length) {
      lines.push('| 标签 / Tag | 级别 / Level | 来源 / Source |', '|---|---|---|');
      for (const id of merged.tags) lines.push(`| \`${id}\` ${label(index.tags[id].label)} | ${LEVEL_NAMES[tagStyle(index, id)]} | ${merged.sources[id].map((s) => SOURCE_NAMES[s]).join('; ')} |`);
    } else lines.push('现在没有标签。/ No tags yet.');
    if (merged.removed.length) lines.push('', `官方去掉的 / Removed by maintainers: ${merged.removed.map((id) => `\`${id}\``).join(', ')}`);
    const note = index.overrides?.[name]?.note;
    if (note) lines.push('', `官方说明 / Maintainer note: ${note.zh} / ${note.en}`);
  }
  const deprecated = doc.versions?.[doc['dist-tags']?.latest]?.deprecated;
  lines.push('', deprecated ? `npm 上已弃用 / Deprecated on npm: "${deprecated}"` : 'npm 上未弃用 / Not deprecated on npm');
  const blocked = blockReason(index, name, (doc.maintainers ?? []).map((m) => m.name));
  if (blocked) lines.push('', `已被拉黑 / Blocked: ${blocked.zh} / ${blocked.en}`);
  return lines;
}

function label({ zh, en }) { return zh === en ? en : `${zh} / ${en}`; }
