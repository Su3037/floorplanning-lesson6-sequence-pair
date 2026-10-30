# 构建与复现 · Build and reproduce

所有命令在仓库根目录运行。网站是纯静态文件（`site/`），所有计算都在访问者的浏览器里完成；下面的工具只用于**重新生成**数据、页面、影片和课件。

## 工具（本次实测版本）

| 用途 | 工具 | 版本 |
| --- | --- | --- |
| 数据、页面、测试 | Node.js ≥ 20 | 22.22.0 |
| Python 练习、交叉测试 | Python ≥ 3.9（只用标准库） | 3.13.17 |
| 影片与课件绘制 | pycairo、Pillow、NumPy | 1.29.2 / 12.3.0 / 2.5.3 |
| 编码 | FFmpeg（libx264、aac） | 6.1.1 |
| 可编辑 PPTX | python-pptx | 1.0.2 |
| 网站字体子集 | fontTools（没有时保留已提交的子集） | 4.68.0 |
| 实验演示录制 | Playwright + Chromium | 预装版本 |

中文字体在仓库里（`fonts/`，OFL）；渲染脚本需要 fontconfig 能找到它们。

## 一步步

```sh
# 1. 数据与页面（几秒）：fixture → trace → 挑战元数据（zh、en）→ 页面 → 在线编程 → 字体子集 → 练习包 README 与 zip
sh scripts/build.sh

# 2. 课件：14 页，中英各一份 PDF + 可编辑 PPTX + 预览图 → site/slides/m06-sequence-pair/
python3 scripts/slides/build_slides.py m06-sequence-pair

# 3. 科普、精讲、进阶影片（video/m06-sequence-pair/films.py）
python3 scripts/film/cinema.py m06-sequence-pair --film concise --stills          # 审片接触表 → build/
python3 scripts/film/cinema.py m06-sequence-pair --film story --sample 60 100     # 小样 → build/samples/
python3 scripts/film/cinema.py m06-sequence-pair --film story --film concise --film advanced   # 成片 → site/media/m06-sequence-pair/

# 4. 实验演示：Playwright 录制真实页面，再合成
python3 scripts/serve.py 8800 floorplanning-lesson6-sequence-pair &
node video/m06-sequence-pair/walkthrough.mjs http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/ zh
node video/m06-sequence-pair/walkthrough.mjs http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/ en
python3 scripts/film/walkthrough.py m06-sequence-pair

# 5. 再跑一次，让页面读到影片与课件信息
sh scripts/build.sh

# 6. 测试
node --test tests/engines.test.mjs tests/challenges.test.mjs tests/site.test.mjs
python3 tests/crosscheck.py
python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/reference.py
python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/en/reference.py
```

## 配乐

精讲、进阶、实验演示用课程原创的 NumPy 合成配乐（`scripts/film/music.py`，CC BY 4.0）。科普片按作者的选择用第三方录音
《We Never (Remix)》（`track:wenever`），**不进仓库**：设置 `LC_MUSIC_WENEVER=/path/to/audio`，或放在
`/mnt/project-files/private-music/wenever.m4a`、`build/private/wenever.m4a`。分段时间来自 `scripts/film/cues/wenever.json`。
没有这段录音时，科普片无法重新渲染；其余三部不受影响。

字幕时长：每条字幕同时满足中文（4.5 字/秒）与英文（15 字符/秒）的最短阅读时间，`readingViolations` 必须为 0（测试会检查）。

## 本地预览（模拟 GitHub Pages 子路径）

```sh
python3 scripts/serve.py 8800 floorplanning-lesson6-sequence-pair   # http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/
```

必须通过 HTTP 打开：直接双击 HTML 时，浏览器会阻止 ES module 和 Web Worker。

## 部署

`.github/workflows/pages.yml`：推送到 `main` 时先跑全部测试，再把 `site/` 发布到 GitHub Pages。仓库设置里 Pages 的来源选 “GitHub Actions”。
影片是普通文件（不用 Git LFS），每个都远小于 GitHub 的 100 MB 单文件上限。
