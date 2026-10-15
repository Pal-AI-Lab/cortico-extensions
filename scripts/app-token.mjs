// 用 GitHub App 私钥换一个只对本仓库、只有 Discussions 读写的安装令牌,写进步骤输出 `token`。
// 私钥只从环境变量读进内存签名,不落盘、不打印。
import { createSign } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { REPO } from './lib.mjs';

const { APP_CLIENT_ID, APP_INSTALLATION_ID, APP_PRIVATE_KEY, GITHUB_OUTPUT } = process.env;
if (!APP_CLIENT_ID || !APP_INSTALLATION_ID || !APP_PRIVATE_KEY) throw new Error('APP_CLIENT_ID, APP_INSTALLATION_ID and APP_PRIVATE_KEY are required');

const b64 = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
// GitHub 认 Client ID 作 iss;iat 往前拨 60 秒抵消时钟偏差,有效期不超过 10 分钟。
const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iat: now - 60, exp: now + 540, iss: APP_CLIENT_ID })}`;
const jwt = `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(APP_PRIVATE_KEY, 'base64url')}`;

const res = await fetch(`https://api.github.com/app/installations/${APP_INSTALLATION_ID}/access_tokens`, {
  method: 'POST',
  headers: { authorization: `Bearer ${jwt}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'cortico-extensions-action' },
  body: JSON.stringify({ repositories: [REPO.name], permissions: { discussions: 'write' } }),
});
const body = await res.json();
if (!res.ok) throw new Error(`installation token: ${res.status} ${body.message ?? ''}`);
console.log(`::add-mask::${body.token}`);
appendFileSync(GITHUB_OUTPUT, `token=${body.token}\n`);
console.log(`Installation token issued, expires ${body.expires_at}`);
