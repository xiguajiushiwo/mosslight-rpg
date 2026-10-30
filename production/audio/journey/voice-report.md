# 《长夜与归途》合成配音记录

校验日期：2026-10-30。

本版已有 322 句中文本地配音，包含 225 句主线对白与 97 句支线对白。MPEG 帧计算的所有文件总时长为 1,832.208 秒（约 30 分 32 秒），共 10,993,248 字节。此总时长包含互斥分支，不等于单次通关的对白长度，也不代表游玩时长。

生成来源：Microsoft Edge Read Aloud 神经语音，使用项目本地的 edge-tts 7.3.1 客户端。生成时提交的是原创游戏台词；播放器读取 `assets/journey-voice/` 中的 MP3，不需要联网。生成工具与依赖不参与游戏运行。

| 角色 | 声线 |
|---|---|
| 林舟、林澄 | zh-CN-YunxiNeural，分别调整语速与音高 |
| 林远、闻叔 | zh-CN-YunyangNeural，分别调整语速与音高 |
| 沈宁、旁白 | zh-CN-XiaoxiaoNeural |
| 苏晚、米娅 | zh-CN-XiaoyiNeural，分别调整语速与音高 |

这是合成配音，未宣称真人表演。已检查全部 322 个文件的台词指纹、字节数、MPEG 帧完整性与时长；浏览器中抽查了母亲回忆、苏晚的决定、海港重逢及结局对白的本地播放。尚未逐句进行听感、发音和情绪表演审校。

生成：`python tools/generate-journey-voice.py`。按台词与声线指纹缓存，可补生成新增台词。

校验：`python tools/validate-journey-voice.py`。结果见 [validation.json](validation.json)；资源清单见 [manifest.json](../../../assets/journey-voice/manifest.json)。

原短篇的 38 句配音仍保留在原资源目录中。
