# Floorplanning · Lesson 6 · 序列对 Sequence-Pair

**中文为主、中英双语**的交互式课程：布图规划里的**序列对**表示法。两个排列给出每一对块的上下左右关系，
关系变成水平 / 竖直约束图，最长路径动态规划算出压紧的坐标；完整、不重叠、装得下、紧凑分开判断。

- 网站 Website：https://su3037.github.io/floorplanning-lesson6-sequence-pair/ （英文版在 `/en/`）
- 来源 Source：教师课程 [yongfu-li/eda-learning](https://github.com/yongfu-li/eda-learning) · `courses/learn_floorplanning` ·
  `module02-05-sequence-pair`（实验 `sequence-pair`），作业 [issue #22](https://github.com/yongfu-li/eda-learning/issues/22)。
  站内显示为 “Module 06”（本课在课程中的位置）。
- 风格 Style：沿用 [Su3037/learning-clustering](https://github.com/Su3037/learning-clustering) 的课程规范（页面结构、四部影片、课件、挑战、在线编程）。

## 内容 What's inside

| | |
| --- | --- |
| 讲解 | 问题定义 → 四种关系 → 约束图 → 最长路径 DP → 四个问题 → 编码与邻居 → 伪代码 → 局限；18 个术语、易错点、来源 |
| 实验台 | 编辑 pos / neg（按钮、Alt + ←/→、拖动或直接输入），单步看每一对关系、每条边、每一次取最大；五个预设（教师示例、横向 / 纵向溢出、同一布局的另一种编码、最紧的 6 × 4）；撤销、随机邻居、旋转（拓展）、导出运行记录 |
| 影片（中、英） | 科普 189.8 s、精讲 129.9 s、进阶 140.9 s、实验演示 170.7 s（英文版 156.5 s）；全部带字幕与文字稿 |
| 课件（中、英） | 14 页 PDF + 可编辑 PPTX，每页下方有讲稿 |
| 挑战 | 7 题（追踪、纠错、构图、实现、约束、比较），每题两级提示，答案由引擎判定 |
| 概念自测 | 6 题，即时反馈 |
| 在线编程 | 浏览器内 Python（Pyodide），5 个任务，7 组检查（含 300 个随机序列对和全部 14,400 对），再用你的函数逐块对照课程引擎 |
| Python 练习包 | `python/m06-sequence-pair/`（starter、reference、check，中英各一份），网站提供 zip 下载 |

本课的数字都由引擎算出并经测试：教师示例 ABCED / DABCE → A(0,0) B(3,0) C(5,0) E(7,0) D(0,3)，包围盒 9 × 4；
边界空余 57、密度 28.75 % 对所有序列对不变；14,400 个序列对全部不重叠，13,680 个装得下。

## 目录 Layout

```text
site/                 静态网站（GitHub Pages 发布的就是它）
  engines/            序列对引擎（纯 JS，网站、影片、课件、测试共用）
  modules/m06-sequence-pair/  课程页与实验台、挑战、可视化
  media/ slides/ data/ downloads/ vendor/
content/              课程文字（中文 + .en 覆盖层）、挑战、课件文字、对照表
fixtures/             五块例子与预设（唯一数据来源）
python/               Python 练习（对应规范中的 exercises/python/）
video/                影片场景与课件图（代码绘制）
scripts/              构建、影片、课件、字体脚本
tests/                引擎、挑战、站点测试；JS ↔ Python 交叉测试
media-source/         媒体来源说明
docs/                 大纲、来源审计、实施计划、决策、验证记录、交接状态、提交草稿
```

## 构建与测试 Build and test

```sh
sh scripts/build.sh                                                  # 数据与页面
python3 scripts/serve.py 8800 floorplanning-lesson6-sequence-pair    # http://127.0.0.1:8800/floorplanning-lesson6-sequence-pair/
node --test tests/engines.test.mjs tests/challenges.test.mjs tests/site.test.mjs
python3 tests/crosscheck.py
python3 python/m06-sequence-pair/check.py python/m06-sequence-pair/reference.py
```

影片与课件的重新生成见 [docs/BUILD.md](docs/BUILD.md)；验证结果见 [docs/verification.md](docs/verification.md)。

## 许可 Licence

- 代码：MIT（`LICENSE`）。
- 本课程新写的教材、影片画面、课件、字幕、原创配乐：CC BY 4.0（`LICENSE-CONTENT.md`）。
- 例子与坐标约定改编自教师课程（CC BY 4.0），署名与改动见 `NOTICE.md`。
- 字体（OFL 1.1）、Pyodide（MPL-2.0）、CodeMirror（MIT）见 `THIRD_PARTY_NOTICES.md`。
- 科普影片的配乐《We Never (Remix)》（Hi Noise / 秋成）是第三方录音，按作者指定使用，**不在本仓库任何许可范围内**，仓库中没有音轨文件。
