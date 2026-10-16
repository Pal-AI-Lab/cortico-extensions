// 讨论区:给 catalog 里还没有讨论帖的包开帖,统计喜欢 / 不喜欢与评论数写回 catalog.json,
// 把每帖的评论快照写进 comments/。帖子只由这里开:分类是 Announcement 格式,用户令牌开不了帖。
// 令牌用 GitHub App 的安装令牌(GH_APP_TOKEN);DRY_RUN=1 时只读不开帖,本地可用自己的令牌试。
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { DISCUSSION_CATEGORY, REPO, SCHEMA, blockReason, fileName, graphql, loadIndex, readJson, root, summary, writeJson } from './lib.mjs';

const token = process.env.GH_APP_TOKEN;
if (!token) throw new Error('GH_APP_TOKEN is required');
const dryRun = process.env.DRY_RUN === '1';
const index = loadIndex();
const catalog = readJson('catalog.json');
if (catalog?.schema !== SCHEMA) throw new Error('catalog.json missing; run scan.mjs first');

const AUTHOR = 'author { login avatarUrl(size: 64) }';
const REACTORS = 'totalCount pageInfo { hasNextPage endCursor } nodes { user { login } }';

const { repository } = await graphql(token, `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) { id discussionCategories(first: 50) { nodes { id slug } } }
}`, REPO);
const category = repository.discussionCategories.nodes.find((c) => c.slug === DISCUSSION_CATEGORY);
if (!category) throw new Error(`discussion category "${DISCUSSION_CATEGORY}" not found`);

// 标题就是包名;同名的帖子以最早开的那个为准。
const threads = new Map();
for (let after = null; ;) {
  const data = await graphql(token, `query($owner: String!, $name: String!, $category: ID!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: 50, after: $after, categoryId: $category, orderBy: { field: CREATED_AT, direction: ASC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id number title url
          up: reactions(content: THUMBS_UP, first: 100) { ${REACTORS} }
          down: reactions(content: THUMBS_DOWN, first: 100) { ${REACTORS} }
          comments { totalCount }
        }
      }
    }
  }`, { ...REPO, category: category.id, after });
  const page = data.repository.discussions;
  for (const d of page.nodes) if (!threads.has(d.title)) threads.set(d.title, d);
  if (!page.pageInfo.hasNextPage) break;
  after = page.pageInfo.endCursor;
}

const created = [];
for (const [name, entry] of Object.entries(catalog.packages)) {
  if (threads.has(name) || blockReason(index, name, entry.maintainers)) continue;
  if (dryRun) { created.push(`${name} (dry run)`); continue; }
  const { createDiscussion } = await graphql(token, `mutation($repo: ID!, $category: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repo, categoryId: $category, title: $title, body: $body }) { discussion { id number url } }
  }`, { repo: repository.id, category: category.id, title: name, body: threadBody(name) });
  threads.set(name, { ...createDiscussion.discussion, title: name, up: { nodes: [], totalCount: 0 }, down: { nodes: [], totalCount: 0 }, comments: { totalCount: 0 } });
  created.push(name);
  // GitHub 对连续创建内容有次级限速,开帖之间留间隔。
  await new Promise((r) => setTimeout(r, 1500));
}

const snapshots = new Set();
for (const [name, entry] of Object.entries(catalog.packages)) {
  const d = threads.get(name);
  if (!d) { delete entry.discussion; continue; }
  const up = await reactors(d.id, 'THUMBS_UP', d.up);
  const down = await reactors(d.id, 'THUMBS_DOWN', d.down);
  // 绕过 WebUI 两种都点的账号算作不投票。
  const both = new Set([...up].filter((u) => down.has(u)));
  const comments = d.comments.totalCount ? await commentTree(d.id) : [];
  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  entry.discussion = { number: d.number, url: d.url, up: up.size - both.size, down: down.size - both.size, comments: total };
  if (total) {
    writeJson(`comments/${fileName(name)}.json`, { schema: SCHEMA, name, discussion: d.url, total, comments });
    snapshots.add(fileName(name));
  }
}
// 评论全被删掉或隐藏的帖子不留快照文件;WebUI 读不到快照就当没有评论。
if (existsSync(`${root}comments`)) for (const f of readdirSync(`${root}comments`)) if (!snapshots.has(f.replace(/\.json$/, ''))) rmSync(`${root}comments/${f}`);

writeJson('catalog.json', catalog);
summary(`### Discussions\n\n${threads.size} threads, ${snapshots.size} with comments.${created.length ? `\n\nOpened: ${created.map((n) => `\`${n}\``).join(', ')}` : ''}`);

function threadBody(name) {
  const npm = `https://www.npmjs.com/package/${name}`;
  return [
    `<!-- cortico-extension: ${name} -->`,
    `**[${name}](${npm})**`,
    '',
    '这一帖是 Cortico 扩展市场里这个扩展的评论区:回复就是评论;对这一帖点 👍 / 👎 就是喜欢 / 不喜欢。在 Cortico WebUI 的扩展详情里也能直接投票和评论。',
    '',
    'This thread is the comment section for this extension in the Cortico extension market. Replies are comments; a 👍 or 👎 on this post is a like or dislike. You can also vote and comment from the extension details in the Cortico WebUI.',
  ].join('\n');
}

/** 一种 reaction 的全部账号;首页超过 100 个时往后翻。 */
async function reactors(id, content, first) {
  const users = new Set(first.nodes.map((n) => n.user?.login).filter(Boolean));
  for (let page = first.pageInfo; page?.hasNextPage;) {
    const data = await graphql(token, `query($id: ID!, $content: ReactionContent!, $after: String) {
      node(id: $id) { ... on Discussion { reactions(content: $content, first: 100, after: $after) { ${REACTORS} } } }
    }`, { id, content, after: page.endCursor });
    const r = data.node.reactions;
    for (const n of r.nodes) if (n.user?.login) users.add(n.user.login);
    page = r.pageInfo;
  }
  return users;
}

/** 全部顶层评论(新的在前)与各自的回复(旧的在前);被隐藏的不要。 */
async function commentTree(id) {
  const out = [];
  for (let after = null; ;) {
    const data = await graphql(token, `query($id: ID!, $after: String) {
      node(id: $id) { ... on Discussion { comments(first: 50, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id body createdAt isMinimized ${AUTHOR} replies(first: 100) { nodes { id body createdAt isMinimized ${AUTHOR} } } }
      } } }
    }`, { id, after });
    const page = data.node.comments;
    for (const c of page.nodes) {
      if (c.isMinimized) continue;
      const replies = c.replies.nodes.filter((r) => !r.isMinimized).map(comment);
      out.push({ ...comment(c), ...(replies.length && { replies }) });
    }
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out.reverse();
}

function comment(c) {
  return { id: c.id, author: c.author?.login ?? 'ghost', ...(c.author?.avatarUrl && { avatar: c.author.avatarUrl }), body: c.body, createdAt: c.createdAt };
}
