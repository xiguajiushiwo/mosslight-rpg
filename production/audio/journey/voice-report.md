# 《长夜与归途》合成配音记录

校验日期：2026-10-30。

本版已有 322 句中文本地配音，包含 225 句主线对白与 97 句支线对白。MPEG 帧计算的所有文件总时长为 1,832.208 秒（约 30 分 32 秒），共 10,993,248 字节。此总时长包含互斥分支，不等于单次通关的对白长度，也不代表游玩时长。

生成来源：Microsoft Edge Read Aloud 神经语音，使用 edge-tts 7.3.1 客户端。生成时提交的是原创游戏台词；播放器读取 `assets/journey-voice/` 中的 MP3，不需要联网。生成工具与依赖不参与游戏运行。

| 角色 | 声线 |
|---|---|
| 林舟、林澄 | zh-CN-YunxiNeural，分别调整语速与音高 |
| 林远、闻叔 | zh-CN-YunyangNeural，分别调整语速与音高 |
| 沈宁、旁白 | zh-CN-XiaoxiaoNeural |
| 苏晚、米娅 | zh-CN-XiaoyiNeural，分别调整语速与音高 |

这是合成配音，未宣称真人表演。已检查全部 322 个文件的台词指纹、字节数、MPEG 帧完整性与时长；浏览器中抽查了母亲回忆、苏晚的决定、海港重逢及结局对白的本地播放。尚未逐句进行听感、发音和情绪表演审校。

在仓库根目录创建 `.venv` 并安装 [requirements-voice.txt](../../../tools/requirements-voice.txt) 中固定的 `edge-tts==7.3.1`。Windows PowerShell 示例：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r tools/requirements-voice.txt
.\.venv\Scripts\python.exe tools/generate-journey-voice.py
.\.venv\Scripts\python.exe tools/validate-journey-voice.py
```

Node 从 `MOSSLIGHT_NODE` 指定的位置或 PATH 查找；缺少 Node 时需安装或设置路径，不依赖某台机器的 Codex 运行时目录。生成需要网络；播放已有 MP3 不需要这些开发依赖。

生成器直接读取 [journey-data.js](../../../src/journey-data.js)，按台词与声线指纹补生成或更新语音。缓存记录统一存于本版 [manifest.json](../../../assets/journey-voice/manifest.json)，不再维护逐句 JSON。原短篇使用自己资源目录中的清单，二者互不覆盖。

校验器与短篇共用 [voice_common.py](../../../tools/voice_common.py) 的 MPEG 帧解析器。结果见 [validation.json](validation.json)；完整文字可阅读 [完整对白](../../../design/完整对白.md)。

原短篇的 38 句配音仍保留在原资源目录中。
