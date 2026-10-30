# 苔灯之森 · 中文剧情配音交付

生成日期：2026-10-29。来源脚本：`src/story.js`；共 9 场、38 句。

## 实际生成结果

全部 38 句已生成本地 MP3，位于 `assets/voice/`，不是浏览器朗读占位。总计 **1,412,928 字节**；逐 MPEG 音频帧解析的总时长为 **235.488 秒**（约 3 分 55 秒）。文件采样率为 24 kHz。服务返回的语音边界时长合计 233.595 秒，不包含完整文件尾部留白，与文件时长定义不同。结局林舟的台词已调整为适配两种未来约定，并重新生成对应音频。

使用 Microsoft Edge Read Aloud 中文神经语音，由 PyPI `edge-tts 7.3.1` 开源客户端调用；依赖仅安装在本项目 `.tools/python-deps/`。首次直连试播成功，随后以最多两个并发请求完成全部生成，没有使用付费 API、Windows SAPI 回退或真人录音。只提交了本游戏原创剧情文本。

| 角色 | 声线 | 句数 | 语速 / 音高 |
|---|---|---:|---|
| 林间来信 · 旁白 | `zh-CN-XiaoxiaoNeural` | 7 | −10% / −2 Hz |
| 林舟 | `zh-CN-YunxiNeural` | 13 | −8% / −2 Hz |
| 林远 · 父亲 | `zh-CN-YunyangNeural` | 7 | −12% / −8 Hz |
| 沈宁 · 母亲 | `zh-CN-XiaoxiaoNeural` | 3 | −12% / −5 Hz |
| 苏晚 | `zh-CN-XiaoyiNeural` | 8 | −8% / 0 Hz |

母亲与旁白使用同一基础声线，语速和音高有所区分；其余三位主要人物使用不同声线。所有输出音量设为 −8%，播放端初始音量为 0.90。

## 集成接口

`src/voice.js` 提供全局 `StoryVoice`，直接置于游戏代码之前加载即可；不需要模块加载器或网络 manifest 请求，本地文件和 HTTP 均可使用。

```js
const voice = new StoryVoice();
voice.speak(line, {
  onEnd: () => { /* 仅实际播完后触发 */ },
  onStatus: text => { /* 可用、播放中、系统语音、不可用、静音、已暂停 */ }
});
voice.stop();
voice.setMuted(true);
voice.pause();
voice.resume();
```

- `speak` 返回 `Promise<boolean>`：完整播完为 `true`；被替换、停止、静音或不可用为 `false`。失败不会调用 `onEnd`，防止没有声音时直接跳过尚未阅读的台词。
- `muted`、`available`、`source` 可供界面读取。`source` 为 `local`、`speechSynthesis` 或 `unavailable`；`available` 表示当前已知播放能力，不代表所有浏览器都已逐一测试。
- 优先播放已生成的本地文件。加载失败或播放被拒绝时，使用浏览器中文 `speechSynthesis`，优先本地中文声线；仍不可用则正常返回并保留文字阅读。
- 递增取消令牌保护旧的 `onended`、播放 Promise 失败及备用语音回调；下一句、跳过或场景切换调用 `stop()` 即可。静音会停止当前句；取消静音后由游戏决定是否重播当前句。
- 所有播放等待都有有界超时。显式暂停期间不会误触发超时结束；恢复从剩余音频继续。

## 复现与验证

1. 使用 Python 安装开发依赖：`python -m pip install --target .tools/python-deps edge-tts`。
2. `python tools/generate-voice.py --probe` 生成第一句以验证服务连接。
3. `python tools/generate-voice.py` 生成全部台词；按文本 SHA-256 和声线配置缓存，台词或声线变化会重新生成。`--force` 可强制重做。
4. `python tools/validate-voice.py` 检查全部 ID、文件大小、文本指纹、每一帧 MPEG 结构与时长。
5. `node tests/voice.test.cjs` 检查取消旧句、文件播放失败回退、过期 Promise、静音、暂停恢复和无语音环境。

脚本优先读取 `MOSSLIGHT_NODE` 环境变量，其次使用 PATH 中的 Node，最后使用本机 Codex 已有 Node 路径。生成需要网络；游戏播放已有本地 MP3 不需要网络。`.tools/python-deps/` 是生成阶段的开发依赖，不是游戏运行依赖。

验证结果：**38/38 资源存在、非空、文本指纹一致，全部 MP3 帧完整；播放模块行为测试通过。** 完整验证数据见 `validation.json`，生成清单见 `assets/voice/manifest.json`，原始台词快照见 `script.json`。

真实浏览器已验证开场、父亲、苏晚与结局演出的本地播放状态，以及配音静音/重启、下一句、跳过的界面与流程。人工逐句听感和与背景音乐的主观混音体验尚未评估。神经合成声音已实际生成，但不声称达到真人配音表演水准。
