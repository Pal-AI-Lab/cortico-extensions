// 扫 npm 上的 Cortico 扩展,生成 catalog.json、packages/ 与 assets/。只读包文件,不执行包里的代码。
// 讨论帖统计由 discussions.mjs 写进 catalog.json,这里原样保留上一次的值。
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import {
  KIND_KEYWORDS, SCHEMA, blockReason, certifyChecks, fetchJson, fileName, githubOwner, loadIndex, mergeTags,
  packument, readJson, repositoryUrl, root, summary, tagStyle, writeJson,
} from './lib.mjs';
import { openRequests, saveResults } from './sync-requests.mjs';

const MAX_TARBALL = 64 * 1024 * 1024;
const MAX_DESCRIBE = 1024 * 1024;
const MAX_ICON = 512 * 1024;
const MAX_SCREENSHOT = 2 * 1024 * 1024;
const MAX_SCREENSHOTS = 8;
const CHANGELOG_LIMIT = 2000;
const ICON_EXT = ['.png', '.webp', '.svg'];
const SHOT_EXT = ['.png', '.webp', '.jpg', '.jpeg'];

const index = loadIndex();
const previous = readJson('catalog.json', { packages: {}, sticky: {} });
const today = new Date();

// 搜索结果 ∪ 上次的 catalog ∪ index.json 覆盖过的包 ∪ 同步请求里的包:搜索接口偶尔漏包、收录新包也慢,包文档才是准的。
const requests = await openRequests();
const requested = new Set(requests.flatMap((r) => r.names));
const names = new Set([...Object.keys(previous.packages ?? {}), ...Object.keys(index.overrides ?? {}), ...requested]);
for (const keyword of Object.values(KIND_KEYWORDS)) {
  for (let from = 0; ; from += 250) {
    const page = await fetchJson(`https://registry.npmjs.org/-/v1/search?text=keywords:${keyword}&size=250&from=${from}`);
    for (const { package: p } of page.objects) if (p.keywords?.includes(keyword)) names.add(p.name);
    if (page.objects.length < 250) break;
  }
}

const downloads = await fetchDownloads([...names]);
const packages = {};
const sticky = {};
const notes = { impersonation: [], certify: [], skipped: [] };
const missing = new Set();

for (const name of [...names].sort()) {
  const doc = await packument(name);
  const latest = doc?.versions?.[doc['dist-tags']?.latest];
  if (!latest || doc.time?.unpublished) { missing.add(name); continue; }
  const kind = latest.cortico?.kind ?? Object.entries(KIND_KEYWORDS).find(([, k]) => latest.keywords?.includes(k))?.[0];
  if (!kind) continue;

  // 粘住名单:任一版本在 cortico.tags 里声明过的警示标签,只增不减;已降级的不再沿用。
  const warn = new Set((previous.sticky?.[name] ?? []).filter((id) => tagStyle(index, id) === 'warning'));
  for (const v of Object.values(doc.versions)) for (const id of tagList(v.cortico?.tags)) if (tagStyle(index, id) === 'warning') warn.add(id);
  if (warn.size) sticky[name] = [...warn].sort();

  const maintainers = (doc.maintainers ?? []).map((m) => m.name).sort();
  const repository = repositoryUrl(latest.repository);
  const declared = tagList(latest.cortico?.tags).filter((id) => index.tags[id]);
  const merged = mergeTags(index, { declared, keywords: latest.keywords ?? [], sticky: sticky[name] }, index.overrides?.[name]);
  const official = maintainers.some((m) => index.official.maintainers.includes(m)) && index.official.githubOwners.includes(githubOwner(repository));
  const created = doc.time?.created;
  const blocked = !!blockReason(index, name, maintainers);
  const author = typeof latest.author === 'string' ? latest.author.replace(/\s*[<(].*$/, '').trim() : latest.author?.name;

  const detail = await packageFiles(name, latest, repository);
  const entry = {
    kind,
    version: latest.version,
    displayName: str(latest.cortico?.displayName),
    description: str(latest.description),
    locales: locales(latest.cortico?.locales),
    author: author || undefined,
    maintainers,
    license: str(latest.license),
    keywords: latest.keywords?.length ? latest.keywords : undefined,
    links: clean({
      npm: `https://www.npmjs.com/package/${name}`,
      repository,
      homepage: str(latest.homepage),
      bugs: str(typeof latest.bugs === 'string' ? latest.bugs : latest.bugs?.url),
    }),
    os: Array.isArray(latest.os) && latest.os.length ? latest.os : undefined,
    created,
    published: doc.time?.[latest.version],
    versionCount: Object.keys(doc.versions).length,
    deprecated: str(latest.deprecated),
    official,
    isNew: !blocked && !!created && today - new Date(created) < index.newDays * 864e5,
    declaredTags: declared.length ? declared : undefined,
    tags: merged.tags,
    icon: detail.icon,
    screenshots: detail.screenshots,
    downloads: downloads[name] ?? { total: 0, month: 0, week: 0 },
    summary: detail.summary,
    changelog: detail.changelog,
    discussion: previous.packages?.[name]?.discussion,
  };
  packages[name] = clean(entry);

  const text = `${author ?? ''} ${entry.displayName ?? ''}`.toLowerCase();
  if (!maintainers.some((m) => index.official.maintainers.includes(m)) && index.official.names.some((n) => text.includes(n.toLowerCase()))) {
    notes.impersonation.push(`\`${name}\` (author: ${author ?? '—'}, displayName: ${entry.displayName ?? '—'}, maintainers: ${maintainers.join(', ')})`);
  }
  if (index.certified?.includes(name)) {
    const failed = certifyChecks(index, doc, packages[name]).filter((c) => !c.ok).map((c) => c.id);
    if (failed.length) notes.certify.push(`\`${name}\`: ${failed.join(', ')}`);
  }
}

// 下架的包:删掉它的 packages/ 与 assets/ 文件;讨论帖与评论快照留着。
for (const dir of ['packages', 'assets']) {
  if (!existsSync(`${root}${dir}`)) continue;
  const keep = new Set(Object.keys(packages).map(fileName));
  for (const f of readdirSync(`${root}${dir}`)) if (!keep.has(f.replace(/\.json$/, ''))) rmSync(`${root}${dir}/${f}`, { recursive: true });
}

writeJson('catalog.json', { schema: SCHEMA, sticky, packages });

if (requests.length) {
  const results = {};
  for (const name of requested) {
    const prefix = `\`${name}\`: `;
    results[name] = packages[name]
      ? { version: packages[name].version, skipped: notes.skipped.filter((l) => l.startsWith(prefix)).map((l) => l.slice(prefix.length)) }
      : { missing: missing.has(name) };
  }
  saveResults(requests, results);
}

summary([
  `### Catalog\n\n${Object.keys(packages).length} packages, ${Object.keys(sticky).length} with sticky warning tags.`,
  requests.length && `#### Sync requests\n\n${requests.map((r) => `- #${r.number}: ${r.names.join(', ') || '—'}`).join('\n')}`,
  notes.impersonation.length && `#### Possible impersonation (review by hand)\n\n${notes.impersonation.map((l) => `- ${l}`).join('\n')}`,
  notes.certify.length && `#### Certified packages failing automatic checks\n\n${notes.certify.map((l) => `- ${l}`).join('\n')}`,
  notes.skipped.length && `#### Package files skipped\n\n${notes.skipped.map((l) => `- ${l}`).join('\n')}`,
].filter(Boolean).join('\n\n'));

/** 打开详情才要的文件:自描述、更新日志、图标与截图。版本没变就沿用上次解出来的。 */
async function packageFiles(name, latest, repository) {
  const file = fileName(name);
  const prev = readJson(`packages/${file}.json`);
  const prevEntry = previous.packages?.[name];
  const kept = { icon: prevEntry?.icon, screenshots: prevEntry?.screenshots, summary: prevEntry?.summary, changelog: prevEntry?.changelog };
  if (prev?.version === latest.version && prevEntry?.version === latest.version) return kept;
  const result = {};
  const out = { schema: SCHEMA, name, version: latest.version };
  const assetDir = `assets/${file}`;

  let files = new Map();
  if ((latest.dist?.unpackedSize ?? 0) > MAX_TARBALL) notes.skipped.push(`\`${name}\`: unpacked size ${latest.dist.unpackedSize} over limit`);
  else {
    // 下载失败时不写 packages/ 文件,下次扫描再试。
    try {
      const res = await fetch(latest.dist.tarball);
      if (!res.ok) throw new Error(`tarball ${res.status}`);
      files = untar(gunzipSync(Buffer.from(await res.arrayBuffer())));
    } catch (err) {
      notes.skipped.push(`\`${name}\`: ${err.message}`);
      return kept;
    }
  }
  rmSync(`${root}${assetDir}`, { recursive: true, force: true });
  const manifest = latest.cortico ?? {};

  const describePath = safePath(manifest.describe);
  const describeRaw = describePath && files.get(describePath);
  if (describeRaw && describeRaw.length <= MAX_DESCRIBE) {
    try {
      const describe = JSON.parse(describeRaw.toString('utf8'));
      if (describe && typeof describe === 'object' && !Array.isArray(describe)) { out.describe = describe; result.summary = summarize(describe); }
    } catch { notes.skipped.push(`\`${name}\`: ${describePath} is not valid JSON`); }
  } else if (describePath) notes.skipped.push(`\`${name}\`: ${describePath} missing or too large`);

  const changelogFile = [...files.keys()].find((f) => f.toLowerCase() === 'changelog.md');
  if (changelogFile) {
    const sections = splitChangelog(files.get(changelogFile).toString('utf8'));
    if (Object.keys(sections).length) {
      out.changelog = sections;
      result.changelog = { versions: Object.keys(sections), url: changelogUrl(name, latest, repository, changelogFile) };
    }
  }

  const iconPath = safePath(manifest.icon);
  const icon = iconPath && files.get(iconPath);
  const iconExt = iconPath && ext(iconPath);
  if (icon && ICON_EXT.includes(iconExt) && icon.length <= MAX_ICON) result.icon = writeAsset(assetDir, `icon${iconExt}`, icon);
  const shots = [];
  for (const p of (Array.isArray(manifest.screenshots) ? manifest.screenshots : []).map(safePath).filter(Boolean)) {
    const data = files.get(p);
    if (!data || !SHOT_EXT.includes(ext(p)) || data.length > MAX_SCREENSHOT) continue;
    shots.push(writeAsset(assetDir, `screenshot-${shots.length + 1}${ext(p)}`, data));
    if (shots.length >= MAX_SCREENSHOTS) break;
  }
  if (shots.length) result.screenshots = shots;

  writeJson(`packages/${file}.json`, out);
  return result;
}

/** catalog 卡片上那一行能力摘要。 */
function summarize(d) {
  if (d.provider) return clean({ protocols: d.provider.protocols, auth: d.provider.auth, input: d.provider.input, local: d.provider.local });
  if (d.bot) return clean({ worlds: d.bot.worlds?.length ?? 0, memory: d.bot.memory?.name });
  return { tools: d.tools?.length ?? 0, events: d.events?.length ?? 0 };
}

/** 每个 `## ` 标题一段,标题里第一个版本号是这一段的版本;每段截到 2000 字。 */
function splitChangelog(text) {
  const out = {};
  let current;
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const head = /^##\s+(.*)$/.exec(line);
    if (head) {
      const version = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/.exec(head[1])?.[0];
      current = version && !(version in out) ? version : undefined;
      if (current) out[current] = [];
      continue;
    }
    if (/^#\s/.test(line)) { current = undefined; continue; }
    if (current) out[current].push(line);
  }
  for (const [v, lines] of Object.entries(out)) {
    const body = lines.join('\n').trim();
    if (!body) delete out[v];
    else out[v] = body.length > CHANGELOG_LIMIT ? `${body.slice(0, CHANGELOG_LIMIT)}…` : body;
  }
  return out;
}

function changelogUrl(name, latest, repository, file) {
  const dir = typeof latest.repository === 'object' && latest.repository.directory ? `${latest.repository.directory.replace(/^\/|\/$/g, '')}/` : '';
  if (githubOwner(repository)) return `${repository}/blob/HEAD/${dir}${file}`;
  return `https://unpkg.com/${name}@${latest.version}/${file}`;
}

/** 下载量:累计(npm 批量接口最多一年)、近 30 天、近 7 天。作用域包不能批量查,单个查。 */
async function fetchDownloads(all) {
  const out = {};
  const periods = { total: 'last-year', month: 'last-month', week: 'last-week' };
  const plain = all.filter((n) => !n.startsWith('@'));
  for (let i = 0; i < plain.length; i += 100) {
    const batch = plain.slice(i, i + 100);
    for (const [key, period] of Object.entries(periods)) {
      const data = await fetchJson(`https://api.npmjs.org/downloads/point/${period}/${batch.join(',')}`) ?? {};
      for (const n of batch) (out[n] ??= {})[key] = data[n]?.downloads ?? 0;
    }
  }
  for (const n of all.filter((x) => x.startsWith('@'))) {
    for (const [key, period] of Object.entries(periods)) {
      const data = await fetchJson(`https://api.npmjs.org/downloads/point/${period}/${n}`);
      (out[n] ??= {})[key] = data?.downloads ?? 0;
    }
  }
  return out;
}

/** 解 tar(已解压的 gzip);只要普通文件,路径去掉第一段(npm 包是 `package/`)。 */
function untar(buf) {
  const files = new Map();
  let longName;
  for (let i = 0; i + 512 <= buf.length;) {
    const h = buf.subarray(i, i + 512);
    if (h.every((b) => b === 0)) break;
    const field = (o, l) => h.subarray(o, o + l).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(field(124, 12).trim() || '0', 8);
    const type = field(156, 1) || '0';
    const prefix = field(345, 155);
    let path = prefix ? `${prefix}/${field(0, 100)}` : field(0, 100);
    const body = buf.subarray(i + 512, i + 512 + size);
    i += 512 + Math.ceil(size / 512) * 512;
    if (type === 'L') { longName = body.toString('utf8').replace(/\0.*$/s, ''); continue; }
    if (type === 'x') { longName = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'))?.[1] ?? longName; continue; }
    if (longName) { path = longName; longName = undefined; }
    if (type === '0' || type === '7') files.set(path.replace(/^[^/]*\//, ''), body);
  }
  return files;
}

function writeAsset(dir, name, data) {
  mkdirSync(`${root}${dir}`, { recursive: true });
  writeFileSync(`${root}${dir}/${name}`, data);
  return `${dir}/${name}`;
}

function safePath(p) {
  if (typeof p !== 'string' || !p || p.includes('\\') || p.startsWith('/') || /^[A-Za-z]:/.test(p)) return undefined;
  const clean = p.replace(/^\.\//, '');
  return clean.split('/').some((s) => s === '..' || s === '') ? undefined : clean;
}

function locales(value) {
  if (!value || typeof value !== 'object') return undefined;
  const out = {};
  for (const lang of ['zh', 'en']) {
    const l = value[lang];
    if (l && typeof l === 'object') {
      const v = clean({ displayName: str(l.displayName), description: str(l.description) });
      if (Object.keys(v).length) out[lang] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function tagList(v) { return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; }
function str(v) { return typeof v === 'string' && v.trim() ? v.trim() : undefined; }
function ext(p) { return /\.[^./]+$/.exec(p.toLowerCase())?.[0] ?? ''; }
function clean(o) { return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)); }
