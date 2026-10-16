// Action 各脚本共用:读写仓库文件、包名与文件名的换算、标签合并、npm 与 GitHub 请求。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const SCHEMA = 1;
export const REPO = { owner: 'Pal-AI-Lab', name: 'cortico-extensions' };
export const DISCUSSION_CATEGORY = 'extensions';
export const KIND_KEYWORDS = { world: 'cortico-world', provider: 'cortico-provider', bot: 'cortico-bot' };
/** npm 现行规则下的包名(小写,可带作用域);长度另查,不超过 214。 */
export const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function readJson(path, fallback) {
  const file = `${root}${path}`;
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** 内容没变就不写,免得定时任务每次都产生提交。返回是否写了。 */
export function writeJson(path, value) {
  const file = `${root}${path}`;
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (existsSync(file) && readFileSync(file, 'utf8').replace(/\r\n/g, '\n') === text) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  return true;
}

/** `@scope/name` → `@scope__name`;非作用域包名不能以 `@` 开头,换回时不会撞。 */
export const fileName = (pkg) => pkg.replace('/', '__');

export function loadIndex() {
  const index = readJson('index.json');
  if (index?.schema !== SCHEMA) throw new Error(`index.json: expected "schema": ${SCHEMA}`);
  return index;
}

export const tagStyle = (index, id) => index.tags[id]?.style ?? 'plain';

/**
 * 一个包的标签与每个标签的来源。来源:author(当前版本 cortico.tags)、keywords(只映射普通标签)、
 * sticky(任一版本声明过的警示标签)、added(官方 addTags)。官方 removeTags 最后去掉,去优先。
 */
export function mergeTags(index, { declared = [], keywords = [], sticky = [] }, override = {}) {
  const sources = new Map();
  const add = (id, source) => {
    if (!index.tags[id]) return;
    if (!sources.has(id)) sources.set(id, []);
    if (!sources.get(id).includes(source)) sources.get(id).push(source);
  };
  for (const id of declared) if (tagStyle(index, id) !== 'official') add(id, 'author');
  for (const id of keywords) if (tagStyle(index, id) === 'plain') add(id, 'keywords');
  for (const id of sticky) add(id, 'sticky');
  for (const id of override.addTags ?? []) add(id, 'added');
  const removed = (override.removeTags ?? []).filter((id) => sources.has(id));
  for (const id of removed) sources.delete(id);
  const order = Object.keys(index.tags);
  const tags = [...sources.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { tags, sources: Object.fromEntries(tags.map((id) => [id, sources.get(id)])), removed };
}

/** 被拉黑的原因 `{ zh, en }`;包本身优先于发布者。 */
export function blockReason(index, name, maintainers = []) {
  const { packages = {}, publishers = {} } = index.blocked ?? {};
  if (packages[name]) return packages[name];
  const who = maintainers.find((m) => publishers[m]);
  return who ? publishers[who] : undefined;
}

/** GitHub 仓库地址里的 owner,不是 GitHub 时为 undefined。 */
export function githubOwner(url) {
  return /github\.com[/:]([^/]+)\/[^/]+/i.exec(url ?? '')?.[1];
}

export function repositoryUrl(repository) {
  const raw = typeof repository === 'string' ? repository : repository?.url;
  if (!raw) return undefined;
  if (/^[\w.-]+\/[\w.-]+$/.test(raw)) return `https://github.com/${raw}`;
  if (/^github:/.test(raw)) return `https://github.com/${raw.slice(7)}`;
  return raw.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/^ssh:\/\/git@/, 'https://').replace(/\.git$/, '');
}

/**
 * 认证要求里 Action 能自动核对的几条。`doc` 是 npm 的包文档,`entry` 是 catalog 里这个包的条目。
 * 返回 `[{ id, ok }]`,文字由调用方按语言写。
 */
export function certifyChecks(index, doc, entry) {
  const latest = doc.versions?.[doc['dist-tags']?.latest] ?? {};
  const kind = latest.cortico?.kind ?? entry?.kind;
  const isWorld = kind === 'world';
  const deps = Object.keys({ ...latest.dependencies, ...latest.peerDependencies });
  const tags = entry?.tags ?? [];
  return [
    { id: 'versions', ok: Object.keys(doc.versions ?? {}).length >= 2 },
    // 词表里没有给供应商的标签(模型端点的 key 不算 requires-key),供应商留空是对的。
    { id: 'tags', ok: kind === 'provider' || tags.length > 0 },
    { id: 'description', ok: !!latest.description?.trim() },
    { id: 'world-deps', ok: !isWorld || !deps.some((d) => d !== doc.name && d.startsWith('cortico-world-')) },
    { id: 'no-warning', ok: !tags.some((id) => tagStyle(index, id) === 'warning') },
    { id: 'not-blocked', ok: !blockReason(index, doc.name, (doc.maintainers ?? []).map((m) => m.name)) },
  ];
}

export async function fetchJson(url, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return res.json();
    if (res.status === 404) return undefined;
    if (attempt >= 3 || res.status < 500 && res.status !== 429) throw new Error(`${init.method ?? 'GET'} ${url}: ${res.status} ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

export const packument = (name) => fetchJson(`https://registry.npmjs.org/${name.replace('/', '%2F')}`);

export async function graphql(token, query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'cortico-extensions-action' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) throw new Error(`GraphQL ${res.status}: ${JSON.stringify(body.errors ?? body)}`);
  return body.data;
}

export async function rest(token, method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { authorization: `bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'cortico-extensions-action', ...(body && { 'content-type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return undefined;
  const data = await res.json().catch(() => undefined);
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

/** 写进 Action 的运行摘要页;本地跑时打到标准输出。 */
export function summary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`, { flag: 'a' });
  else console.log(markdown);
}
