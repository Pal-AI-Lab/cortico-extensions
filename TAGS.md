<!-- 由 scripts/render-tags.mjs 按 index.json 生成,不要手改。 -->

# Cortico 扩展标签 / Extension tags

扩展在 package.json 的 `cortico.tags` 里从下表选所有贴切的标签,控制台市场按它分类和筛选,鼠标悬停时显示「悬停说明」。
Pick every tag below that fits for `cortico.tags` in package.json; the console market groups and filters by them and shows the hover hint.

```jsonc
"cortico": { "kind": "world", "api": 5, "tags": ["im", "qq", "companion"] }
```

## 怎么选 / How to choose

- 按扩展**接入什么、给 bot 什么能力**选,不按实现手段选。只调 HTTP 接口不算 `browser`,接了 QQ 就是 `qq`。
  Choose by **what the extension connects to and what it lets the bot do**, not by how it is built.
- 依附于另一个扩展的功能包,带上宿主所在的平台标签(QQ 功能包带 `qq`)。
  An add-on pack for another extension carries its host's platform tag (QQ add-ons carry `qq`).
- 只贴确实贴切的,不为多出现在几个筛选里多贴。`apps` 只在其他标签都不适用时用;一个都不贴切就留空,官方会修正。
  Tag only what truly fits, not to appear in more filters. Use `apps` only when no other tag fits; if nothing fits, leave it empty and maintainers will correct tags.
- 只能在某些系统上跑,写 npm 标准字段 `"os": ["win32"]`,不用标签表达。
  Platform limits go in the standard npm `"os"` field, not in tags.
- 写完跑 `pnpm check:extension <包目录>`,不在词表里的标签会被指出。
  Run `pnpm check:extension <dir>` afterwards; tags outside this list are reported.

## 作者可选 / Author tags

| id | 名称 | 什么时候用 / When to use | 悬停说明 / Hover hint | 现有例子 |
|---|---|---|---|---|
| `im` | 即时通讯 / Messaging | 接入任意即时通讯平台收发消息（QQ、Discord、Telegram、微信等），或依附于这类 World 的功能包。<br>Connects to any instant-messaging platform (QQ, Discord, Telegram, WeChat, etc.), or extends such a World. | 接入聊天软件收发消息。<br>Sends and receives messages on a chat platform. | `cortico-world-qq-final-beta` `cortico-world-qq` `cortico-world-qq-lite` `cortico-world-qq-better-alont1` 等 21 个 |
| `qq` | QQ / QQ | 接入 QQ 或依附于某个 QQ World。QQ 生态有大量依附于宿主的功能包，所以单独设一个平台标签；同时也贴 im。<br>Connects to QQ or extends a QQ World. QQ has many add-on packs tied to a host, so it gets its own platform tag; also tag im. | 接入 QQ，或是某个 QQ World 的功能包。<br>Connects to QQ, or is an add-on for a QQ World. | `cortico-world-qq-final-beta` `cortico-world-qq` `cortico-world-qq-lite` `cortico-world-qq-better-alont1` 等 21 个 |
| `streaming` | 直播 / Streaming | 为直播场景设计：读直播间的弹幕、礼物、观众信号，或做直播演出（Live2D、字幕、OBS overlay）。只是在直播里玩过的游戏不算。<br>Built for live streaming: reads a live room's chat, gifts or audience signals, or performs for a stream (Live2D, subtitles, OBS overlay). A game that was merely played on stream does not count. | 成为偶像！为直播场景设计。<br>Become an idol! Built for live streaming. | `cortico-world-bilibili` |
| `game` | 游戏 / Games | 接入、观察或操作一个游戏，包括桌游规则与跑团检定。<br>Connects to, watches or plays a game, including tabletop rules and TRPG checks. | 接入、观察和操作游戏。<br>Connects to, watches and plays games. | `cortico-world-simple-trpg-check` `cortico-world-minecraft` `cortico-world-dungeon` `cortico-world-sisterdrive` 等 12 个 |
| `browser` | 浏览器 / Browser | 打开、读取、点击网页，或内嵌一个网页。只是调 HTTP 接口不算。<br>Opens, reads or clicks web pages, or embeds a web page. Calling an HTTP API alone does not count. | 涉及浏览器操作的功能。<br>Operates a web browser. | `cortico-world-gemini-web` `cortico-world-surfing` `cortico-provider-gemini-web` |
| `video` | 视频 / Video | 让 bot 看视频或直播画面、读字幕，或生成视频。<br>Lets the bot watch videos or stream footage, read subtitles, or make videos. | 让 bot 看视频、读字幕或生成视频。<br>Lets the bot watch videos, read subtitles or make videos. | `cortico-world-surfing` |
| `voice` | 语音 / Voice | 让 bot 听（语音识别）、说（语音合成）或通话。<br>Lets the bot listen (speech recognition), speak (speech synthesis) or take calls. | 让 bot 听、说或通话。<br>Lets the bot listen, speak or take calls. | `cortico-world-asr` `cortico-world-phone` `cortico-world-cosyvoice-tts` `cortico-world-tts` 等 5 个 |
| `computer-use` | 电脑操作 / Computer use | 让 bot 操作用户的电脑：鼠标、键盘、窗口。只读屏幕或前台窗口不算，那类由官方标「读取隐私」。<br>Lets the bot operate the user's computer: mouse, keyboard, windows. Only reading the screen or foreground window does not count; maintainers mark that as sensitive-data. | 让 bot 操作电脑：鼠标、键盘和窗口。<br>Lets the bot operate the computer: mouse, keyboard and windows. | — |
| `real-world` | 现实环境 / Physical world | 操作现实环境里的设备，如智能家居、机器人、传感器。<br>Operates devices in the physical world, such as smart homes, robots or sensors. | 涉及现实环境操作，如智能家居。<br>Acts on the physical world, such as a smart home. | — |
| `apps` | 应用程序 / Apps | 接入、监听或操作其他应用程序。只有其他标签都不适用时才用。<br>Connects to, watches or operates other applications. Use it only when no other tag fits. | 接入、监听或操作其他应用程序。<br>Connects to, watches or operates other applications. | — |
| `memory` | 记忆 / Memory | 帮 bot 记住、检索或整理过去的事：记忆库、聊天记录检索、笔记、相册、记忆体检。注意：我们不推荐通过 World 管理记忆和任何内部状态，请编写 Bot 扩展来处理内部状态管理。<br>Helps the bot remember, search or tidy the past: memory stores, chat history search, notes, albums, memory health checks. Note: we do not recommend managing memory or any internal state in a World; write a bot extension for internal state. | 帮 bot 记住、检索或整理过去的事。注意：我们不推荐通过 World 管理记忆和任何内部状态，请编写 Bot 扩展来处理内部状态管理。<br>Helps the bot remember, search or tidy the past. Note: we do not recommend managing memory or any internal state in a World; write a bot extension for internal state. | `cortico-world-memory` `cortico-world-together-alont1` `cortico-world-learn-alont1` `cortico-world-lite-alont1` 等 9 个 |
| `companion` | 陪伴 / Companion | 让 bot 更像一个有自己生活的伙伴：情绪、好感、作息、时间感、节日、主动开口。注意：我们不推荐通过 World 管理记忆和任何内部状态，请编写 Bot 扩展来处理内部状态管理。<br>Makes the bot feel like a companion with a life of its own: mood, affinity, daily routine, sense of time, festivals, speaking first. Note: we do not recommend managing memory or any internal state in a World; write a bot extension for internal state. | 情绪、好感、作息、时间感、节日、主动开口这类功能。注意：我们不推荐通过 World 管理记忆和任何内部状态，请编写 Bot 扩展来处理内部状态管理。<br>Mood, affinity, daily routine, sense of time, festivals, speaking first. Note: we do not recommend managing memory or any internal state in a World; write a bot extension for internal state. | `cortico-world-life-alont1` `cortico-world-humanlike-alont1` `cortico-world-affinity-alont1` `cortico-world-gaming-alont1` 等 15 个 |
| `creative` | 创作 / Creative | 让 bot 产出作品：画画、生成或修改图片、合成音频作品。<br>Lets the bot make things: drawing, generating or editing images, producing audio pieces. | 让 bot 画画、生成图片这类作品。<br>Lets the bot make works such as drawings and images. | `cortico-world-image` `cortico-world-canvas` |
| `diagnostics` | 诊断 / Diagnostics | 诊断或管理 Cortico 框架本身：用量与花费体检、记忆体检、配置收紧这类。注意：如无必要，我们不推荐通过 World 做这类功能，请发布单独的工具。<br>Diagnoses or manages the Cortico framework itself: usage and cost checks, memory health checks, tightening configuration. Note: unless necessary, we do not recommend building this as a World; publish a separate tool instead. | 涉及 Cortico 框架内部诊断和自我管理的功能。注意：如无必要，我们不推荐通过 World 做这类功能，请发布单独的工具。<br>Diagnoses or manages the Cortico framework itself. Note: unless necessary, we do not recommend building this as a World; publish a separate tool instead. | `cortico-world-memory-doctor-alont1` `cortico-frugal-alont1` |
| `local` | 本地模型 / Local model | 在用户本机跑模型推理（LLM、语音识别、语音合成），需要本机算力或显存。<br>Runs model inference on the user's machine (LLM, speech recognition, speech synthesis) and needs local compute or VRAM. | 在本机跑模型，需要本机算力或显存。<br>Runs a model on this machine; needs local compute or VRAM. | `cortico-world-asr` `cortico-world-cosyvoice-tts` |
| `external-setup` | 需额外安装 / Extra setup | 装上包还不能用，得先另装别的东西：游戏本体或 mod 加载器（BepInEx）、NapCat、VTube Studio、Python 环境、模型权重、游戏服务器。<br>Installing the package is not enough; something else must be set up first: the game itself or a mod loader (BepInEx), NapCat, VTube Studio, a Python environment, model weights, a game server. | 装上包还不能用，要先另装游戏、mod 加载器、NapCat 等。<br>Needs something else installed first, such as the game, a mod loader or NapCat. | `cortico-world-minecraft` `cortico-world-qq-final-beta` `cortico-world-qq` `cortico-world-qq-lite` 等 16 个 |

## 官方标签 / Official tags

下面这些标签由官方审查后添加:`internal-state`、`requires-extension` 显示为黄色提示色,其余显示为红色警示色。作者写进 `cortico.tags` 也会被忽略,作者也去不掉。
没有这些标签只表示还没审查到,不代表安全。
These are added by maintainers after review; `internal-state` and `requires-extension` are shown as yellow notices, the rest as red warnings. Authors cannot add or remove them.
Their absence means "not reviewed yet", not "safe".

| id | 名称 | 什么时候用 / When to use | 悬停说明 / Hover hint | 现有例子 |
|---|---|---|---|---|
| `unsafe` | 不安全 / Unsafe | 官方审查后添加。模型能借它执行任意代码或命令、读写任意文件，或任意操控鼠标键盘。<br>Added after official review. The model can use it to run arbitrary code or commands, read and write arbitrary files, or freely control the mouse and keyboard. | 模型能借它执行任意代码或命令、读写任意文件，或操控鼠标键盘。<br>The model can use it to run arbitrary code or commands, read and write any file, or control the mouse and keyboard. | `cortico-world-python` |
| `sensitive-data` | 读取隐私 / Reads private data | 官方审查后添加。会持续读取屏幕、麦克风、前台窗口或消费记录这类个人数据，并随模型调用发给模型端点。<br>Added after official review. Continuously reads personal data such as the screen, microphone, foreground window or spending records, and sends it to the model endpoint with model calls. | 会持续读取屏幕、麦克风、窗口等个人数据，并发给你配置的模型端点。<br>Continuously reads personal data such as the screen, microphone or windows, and sends it to your configured model endpoint. | `cortico-world-humanlike-alont1` `cortico-world-gaming-alont1` `cortico-world-alive-alont1` `cortico-world-asr` 等 5 个 |
| `unofficial-api` | 非官方接口 / Unofficial API | 官方审查后添加。借用网页登录态、CLI 额度或未公开接口调用服务，可能违反该服务的条款，账号有被限制的风险。<br>Added after official review. Calls a service through a web login session, a CLI quota or an undocumented endpoint; this may break the service's terms and put the account at risk. | 借用登录态或未公开接口调用服务，可能违反服务条款，账号有被限制的风险。<br>Uses a login session or undocumented endpoint; may break the service's terms and put the account at risk. | `cortico-world-gemini-web` `cortico-provider-gemini-web` |
| `internal-state` | 内部状态 / Internal state | 官方审查后添加。World 自己保存并注入 bot 的情绪、好感、记忆、经历这类内部状态。这类功能推荐在 bot 扩展的 Persona 里实现。<br>Added after official review. The World keeps and injects the bot's own internal state: mood, affinity, memories, experiences. We recommend building this into a bot extension's Persona instead. | 这个 World 在 bot 的 Memory 之外自己管理 bot 的内部状态（情绪、好感、记忆等），装上或卸下前后 bot 对自己的认知可能不一致。<br>This World manages the bot's internal state (mood, affinity, memories) outside the bot's Memory, so the bot's sense of itself may differ before and after it is installed or removed. | `cortico-world-memory` `cortico-world-life-alont1` `cortico-world-humanlike-alont1` `cortico-world-affinity-alont1` 等 12 个 |
| `requires-extension` | 依赖其他扩展 / Requires other extensions | 官方审查后添加。这个扩展依赖其他扩展才能正常运行，具体请查看说明。注意：我们强烈不建议引入任何 World 扩展之间的互相依赖，请将单个外部环境整合为单一 World，确为必要时优先通过订阅事件流等方式间接传递信号。Bot 扩展不打这个标签。<br>Added after official review. This extension needs other extensions to work; see its README. Note: we strongly advise against dependencies between World extensions. Integrate one outside environment into a single World; where truly necessary, pass signals indirectly, for example by subscribing to the event stream. Bot extensions do not get this tag. | 这个扩展依赖其他扩展才能正常运行，具体请查看说明。注意：我们强烈不建议引入任何 World 扩展之间的互相依赖，请将单个外部环境整合为单一 World，确为必要时优先通过订阅事件流等方式间接传递信号。<br>This extension needs other extensions to work; see its README. Note: we strongly advise against dependencies between World extensions. Integrate one outside environment into a single World; where truly necessary, pass signals indirectly, for example by subscribing to the event stream. | `cortico-world-gemini-web` `cortico-world-qq-affinity` `cortico-world-qq-admin` `cortico-world-qq-festival` 等 16 个 |
| `high-cost` | 高消耗 / High token use | 会让 bot 频繁调用模型或每次带很多上下文，比如高频事件、持续截屏或视频帧、长文本注入。<br>Makes the bot call the model often or with large context, such as high-frequency events, continuous screenshots or video frames, or long injected text. | 这个扩展可能让 Token 消耗得很快。<br>This extension may use tokens quickly. | — |

## 新增标签 / Proposing a tag

至少 3 个已发布的扩展会用到时,给本仓库提 PR 改 `index.json`,名称与说明给中英两种。
Open a PR against `index.json` once at least 3 published extensions would use the tag; give labels and texts in Chinese and English.
