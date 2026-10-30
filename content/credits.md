<p class="eyebrow">资源与贡献</p>

## 资源与贡献

本课对应 [yongfu-li/eda-learning Issue #22](https://github.com/yongfu-li/eda-learning/issues/22)“Floorplanning - Lesson 6”，主题是教师课程 learn_floorplanning 的第 6 个实验：序列对（目录编号 `module02-05-sequence-pair`，实验编号 `sequence-pair`）。

### 教师课程（CC BY 4.0）

| 项目 | 内容 |
| --- | --- |
| 作者 | Yongfu Li · learn_floorplanning |
| 来源 | [module02-05-sequence-pair（固定提交 003bcd4）](https://github.com/yongfu-li/eda-learning/tree/003bcd49e3794e6cfd2680181cdbd347d673ad07/courses/learn_floorplanning/module02-05-sequence-pair) |
| 许可 | CC BY 4.0 |
| 沿用 | 五块例子 A–E 的尺寸、10 × 8 边界、示例序列对 pos = A B C E D / neg = D A B C E；坐标约定；伪代码骨架；“浏览器实验 + 自己实现”两条路线 |
| 修改 | 边界写法 `{W, H}` 统一为 `{w, h}`；删除了与示例序列对不一致的 `GOLDEN_PACK`（D 在 y = 2）教学用法；把“装得下”和“不重叠”分开报告；替换了只考记忆的测验题 |

讲解、引擎、实验、挑战、影片、课件和 Python 练习都是新写的。教师平台的 JavaScript 只用于了解原实验的行为，没有复制。逐项修改说明见仓库的 [NOTICE.md](https://github.com/Su3037/floorplanning-lesson6-sequence-pair/blob/main/NOTICE.md)。

### 论文与拓展阅读

- H. Murata, K. Fujiyoshi, S. Nakatake, Y. Kajitani. VLSI module placement based on rectangle-packing by the sequence-pair. *IEEE TCAD*, 15(12):1518–1524, 1996。序列对的原始论文。本课只引用，不转载其中的图。
- X. Tang, D. F. Wong. FAST-SP: a fast algorithm for block placement based on sequence pair. *ASP-DAC*, 2001。O(n log n) 求值，本课未实现。
- S. N. Adya, I. L. Markov. Fixed-outline floorplanning: enabling hierarchical design. *IEEE TVLSI*, 11(6), 2003。固定边界下的序列对搜索（Parquet）。

### 本课的许可

| 部分 | 许可 |
| --- | --- |
| 代码（`site/`、`scripts/`、`python/`、`tests/`） | MIT |
| 讲解、课件、影片画面、例子数据 | CC BY 4.0（例子数据改编自教师课程，同为 CC BY 4.0） |
| 字体子集 | 各自的开源字体许可，见 THIRD_PARTY_NOTICES.md |
| 浏览器内 Python（Pyodide）、代码编辑器（CodeMirror） | 各自许可，见 THIRD_PARTY_NOTICES.md |
| 科普片配乐 | 见下 |

### 配乐

精讲、进阶与实验演示片的配乐由本课脚本合成，随画面一起以 CC BY 4.0 发布。科普片若使用作者指定的第三方录音，该录音**不在本课程许可范围内**，本课不授予其任何使用权，仓库里也不包含音轨文件；需要再利用画面时，请使用无配乐版本。

### 制作

课程作者 Su3037。制作过程由 Claude（Anthropic）协助：起草讲解与代码、生成影片与课件，作者负责选题、审阅与发布。所有数字由引擎计算并经测试复核，记录见仓库 `docs/verification.md`。
