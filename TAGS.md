<!-- 由 scripts/render-tags.mjs 按 index.json 生成,不要手改。 -->

# Cortico 扩展标签 / Extension tags

扩展在 package.json 的 `cortico.tags` 里从下表选**最多 3 个**标签,控制台市场按它分类和筛选。
Pick **at most 3** tags from the table below for `cortico.tags` in package.json; the console market groups and filters by them.

```jsonc
"cortico": { "kind": "world", "api": 5, "tags": ["qq", "companion"] }
```

## 怎么选 / How to choose

- 按扩展**接入什么、给 bot 什么能力**选,不按实现手段选。用了浏览器不等于 `web`,接了 QQ 就是 `qq`。
  Choose by **what the extension connects to and what it lets the bot do**, not by how it is built.
- 依附于另一个扩展的功能包,带上宿主所在的平台标签(QQ 功能包带 `qq`)。
  An add-on pack for another extension carries its host's platform tag (QQ add-ons carry `qq`).
- 一个都不贴切就留空,不要硬选 `utility`。官方会补。
  If nothing fits, leave it empty rather than forcing `utility`; the maintainers will tag it.
- 只能在某些系统上跑,写 npm 标准字段 `"os": ["win32"]`,不用标签表达。
  Platform limits go in the standard npm `"os"` field, not in tags.
- 写完跑 `pnpm check:extension <包目录>`,不在词表里的标签会被指出。
  Run `pnpm check:extension <dir>` afterwards; tags outside this list are reported.

## 作者可选 / Author tags

| id | 名称 | 什么时候用 / When to use | 现有例子 |
|---|---|---|---|
| `qq` | QQ / QQ | 接入 QQ 或依附于某个 QQ World(OneBot / NapCat 适配器、QQ 功能包、QQ 空间、QQ 通话)。<br>Connects to QQ or extends a QQ World (OneBot / NapCat adapters, QQ add-on packs, Qzone, QQ calls). | `cortico-world-qq-final-beta` `cortico-world-qq` `cortico-world-qq-lite` `cortico-world-qq-better-alont1` 等 21 个 |
| `streaming` | 直播 / Streaming | 读直播间的弹幕、礼物、观众信号,或为直播做演出(Live2D、字幕、OBS overlay)。只是在直播里玩过的游戏不算。<br>Reads a live room's chat, gifts or audience signals, or performs for a stream (Live2D, subtitles, OBS overlay). A game that was merely played on stream does not count. | `cortico-world-bilibili` |
| `game` | 游戏 / Games | 让 bot 玩、操控或旁观一个游戏,包括桌游规则与跑团检定。<br>Lets the bot play, control or watch a game, including tabletop rules and TRPG checks. | `cortico-world-simple-trpg-check` `cortico-world-minecraft` `cortico-world-dungeon` `cortico-world-sisterdrive` 等 12 个 |
| `web` | 网页与视频 / Web & video | 搜索、读网页正文、看视频或字幕,用来获取外部信息。<br>Searches, reads web pages, or watches videos and subtitles to bring in outside information. | `cortico-world-websearch` `cortico-world-learn-alont1` `cortico-world-surfing` |
| `voice` | 语音 / Voice | 让 bot 听(语音识别)、说(语音合成)或通话。<br>Lets the bot listen (speech recognition), speak (speech synthesis) or take calls. | `cortico-world-asr` `cortico-world-phone` `cortico-world-cosyvoice-tts` `cortico-world-tts` 等 5 个 |
| `desktop` | 桌面 / Desktop | 在用户的电脑桌面上出现或起作用:桌宠、读前台窗口、在不在电脑前、操控鼠标键盘。<br>Lives on or acts on the user's desktop: desktop pets, reading the foreground window, presence detection, mouse and keyboard control. | `cortico-world-humanlike-alont1` `cortico-world-gaming-alont1` `cortico-world-alive-alont1` `cortico-world-presence` |
| `memory` | 记忆 / Memory | 帮 bot 记住、检索或整理过去的事:记忆库、聊天记录检索、笔记、相册、记忆体检。<br>Helps the bot remember, search or tidy the past: memory stores, chat history search, notes, albums, memory health checks. | `cortico-world-memory` `cortico-world-together-alont1` `cortico-world-learn-alont1` `cortico-world-lite-alont1` 等 9 个 |
| `companion` | 陪伴 / Companion | 让 bot 更像一个有自己生活的伙伴:情绪、好感、作息、时间感、节日、主动开口。<br>Makes the bot feel like a companion with a life of its own: mood, affinity, daily routine, sense of time, festivals, speaking first. | `cortico-world-life-alont1` `cortico-world-humanlike-alont1` `cortico-world-affinity-alont1` `cortico-world-gaming-alont1` 等 15 个 |
| `creative` | 创作 / Creative | 让 bot 产出作品:画画、生成或修改图片、合成音频作品。<br>Lets the bot make things: drawing, generating or editing images, producing audio pieces. | `cortico-world-image` `cortico-world-canvas` `cortico-world-tts` |
| `utility` | 工具 / Utilities | 提醒、群管理、限速防刷、省 token、给其他语言写插件的桥接这类运维与效率功能。上面的标签都不合适时才用。<br>Operational and productivity helpers: reminders, group moderation, rate limits, token savings, bridges for plugins in other languages. Use it only when none of the tags above fits. | `cortico-world-gemini-web` `cortico-world-python` `cortico-frugal-alont1` `cortico-world-qq-admin` 等 7 个 |
| `local` | 本地模型 / Local model | 在用户本机跑模型推理(LLM、语音识别、语音合成),需要本机算力或显存。<br>Runs model inference on the user's machine (LLM, speech recognition, speech synthesis) and needs local compute or VRAM. | `cortico-world-asr` `cortico-world-cosyvoice-tts` |
| `external-setup` | 需额外安装 / Extra setup | 装上包还不能用,得先另装别的东西:游戏本体或 mod 加载器(BepInEx)、NapCat、VTube Studio、Python 环境、模型权重、游戏服务器。<br>Installing the package is not enough; something else must be set up first: the game itself or a mod loader (BepInEx), NapCat, VTube Studio, a Python environment, model weights, a game server. | `cortico-world-minecraft` `cortico-world-qq-final-beta` `cortico-world-qq` `cortico-world-qq-lite` 等 16 个 |

## 官方标签 / Official tags

下面这些标签由官方审查后添加,显示为警示色。作者写进 `cortico.tags` 也会被忽略,作者也去不掉。
没有这些标签只表示还没审查到,不代表安全。
These are added by maintainers after review and shown as warnings. Authors cannot add or remove them.
Their absence means "not reviewed yet", not "safe".

| id | 名称 | 什么时候用 / When to use | 现有例子 |
|---|---|---|---|
| `unsafe` | 不安全 / Unsafe | 官方审查后添加。模型能借它执行任意代码或命令、读写任意文件,或任意操控鼠标键盘。<br>Added after official review. The model can use it to run arbitrary code or commands, read and write arbitrary files, or freely control the mouse and keyboard. | `cortico-world-python` |
| `sensitive-data` | 读取隐私 / Reads private data | 官方审查后添加。会持续读取屏幕、麦克风、前台窗口或消费记录这类个人数据,并随模型调用发给模型端点。<br>Added after official review. Continuously reads personal data such as the screen, microphone, foreground window or spending records, and sends it to the model endpoint with model calls. | `cortico-world-humanlike-alont1` `cortico-world-gaming-alont1` `cortico-world-alive-alont1` `cortico-world-asr` 等 5 个 |
| `unofficial-api` | 非官方接口 / Unofficial API | 官方审查后添加。借用网页登录态、CLI 额度或未公开接口调用服务,可能违反该服务的条款,账号有被限制的风险。<br>Added after official review. Calls a service through a web login session, a CLI quota or an undocumented endpoint; this may break the service's terms and put the account at risk. | `cortico-world-gemini-web` `cortico-provider-gemini-web` |

## 新增标签 / Proposing a tag

至少 3 个已发布的扩展会用到时,给本仓库提 PR 改 `index.json`,11 种语言的名称都要给。
Open a PR against `index.json` once at least 3 published extensions would use the tag; include labels for all 11 languages.
