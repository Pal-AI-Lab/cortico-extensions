// 同步请求:标题是 `[sync] 包名` / `[同步] 包名` 的 issue,开出来就触发 sync.yml。scan.mjs 把开着的请求里的包名
// 并进扫描名单(不用等 npm 搜索收录新包),写下每个包的结果;提交之后 `node scripts/sync-requests.mjs` 逐个回帖并关闭。
// 只回这次扫描读到的请求,扫描途中新开的留给它自己触发的那次运行。令牌是 Action 的 GITHUB_TOKEN;没有令牌时不读也不回。
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NPM_NAME, REPO, blockReason, loadIndex, readJson, rest } from './lib.mjs';
import { parseBody, parseTitle } from './triage.mjs';

/** 一个请求最多收几个包名。 */
const MAX_NAMES = 10;
/** scan.mjs 写、回帖时读;在仓库外,不会被提交。 */
const RESULT_FILE = join(process.env.RUNNER_TEMP || tmpdir(), 'cortico-sync-requests.json');
const repo = `/repos/${REPO.owner}/${REPO.name}`;

/** 开着的同步请求 `[{ number, names, invalid, extra }]`:names 并进扫描,invalid 不是合法包名,extra 超出个数。 */
export async function openRequests() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];
  const out = [];
  for (let page = 1; ; page++) {
    const issues = await rest(token, 'GET', `${repo}/issues?state=open&per_page=100&page=${page}`);
    for (const issue of issues) if (!issue.pull_request && parseTitle(issue.title).type === 'sync') out.push({ number: issue.number, ...requestedNames(issue) });
    if (issues.length < 100) return out;
  }
}

/** 标题里的包名与正文 `package` 一项里的包名,去重。 */
export function requestedNames(issue) {
  const { target } = parseTitle(issue.title);
  const all = [...new Set([target, ...(parseBody(issue.body).packages ?? [])].filter(Boolean))];
  const valid = all.filter((n) => n.length <= 214 && NPM_NAME.test(n));
  return { names: valid.slice(0, MAX_NAMES), invalid: all.filter((n) => !valid.includes(n)), extra: valid.slice(MAX_NAMES) };
}

/** scan.mjs 扫完调用。`results[包名]`:进了 catalog 的是 `{ version, skipped }`,没进的是 `{ missing }`。 */
export function saveResults(requests, results) {
  writeFileSync(RESULT_FILE, JSON.stringify({ requests, results }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await reply();

async function reply() {
  const token = process.env.GITHUB_TOKEN;
  if (!token || !existsSync(RESULT_FILE)) return;
  const { requests, results } = JSON.parse(readFileSync(RESULT_FILE, 'utf8'));
  const index = loadIndex();
  const catalog = readJson('catalog.json', { packages: {} });
  for (const r of requests) {
    await rest(token, 'POST', `${repo}/issues/${r.number}/comments`, { body: compose(r, results, index, catalog) });
    await rest(token, 'PATCH', `${repo}/issues/${r.number}`, { state: 'closed', state_reason: 'completed' });
  }
}

export function compose(r, results, index, catalog) {
  const lines = ['已同步一次。/ Synced.', ''];
  if (!r.names.length && !r.invalid.length) lines.push('没有写包名,照常扫了一遍 npm。/ No package named; ran the regular npm scan.', '');
  for (const name of r.names) lines.push(`- \`${name}\`:${outcome(name, results[name] ?? {}, index, catalog)}`);
  // 不合规的原文可能带反引号、@ 或链接,不回显,只报个数
  if (r.invalid.length) lines.push(`- 另有 ${r.invalid.length} 项不是合法的 npm 包名,没处理 / ${r.invalid.length} more item(s) are not valid npm package names; skipped`);
  if (r.extra.length) lines.push(`- 一次最多 ${MAX_NAMES} 个,没处理 / At most ${MAX_NAMES} per request, skipped: ${r.extra.map((n) => `\`${n}\``).join(', ')}`);
  lines.push(
    '',
    'WebUI 的扩展市场最多约 10 分钟后显示(索引文件有 5 分钟 CDN 缓存,Cortico 再缓存 5 分钟)。还有问题就重新打开这个 issue,会再同步一次。',
    '',
    'The WebUI market shows this within about 10 minutes (the index files have a 5-minute CDN cache, and Cortico caches them for another 5). Reopen this issue to sync again.',
  );
  return lines.join('\n');
}

function outcome(name, result, index, catalog) {
  const entry = catalog.packages?.[name];
  if (!entry) {
    return result.missing
      ? 'npm 上找不到。刚发布的包有时要等一两分钟,稍后重新打开这个 issue。/ Not found on npm. A package published moments ago can take a minute or two; reopen this issue later.'
      : '没有 `cortico-world` / `cortico-provider` / `cortico-bot` 关键字,也没有 `cortico.kind`,不收进市场。/ Has no `cortico-world` / `cortico-provider` / `cortico-bot` keyword and no `cortico.kind`; not listed.';
  }
  const parts = [`已收录 ${entry.version} / Listed at ${entry.version}`];
  const blocked = blockReason(index, name, entry.maintainers);
  if (blocked) parts.push(`已被拉黑 / Blocked: ${blocked.zh} / ${blocked.en}`);
  for (const s of result.skipped ?? []) parts.push(`详情文件 / Detail files: ${s}`);
  return parts.join(';');
}
