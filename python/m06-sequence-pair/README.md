# Module 06 序列对 · Python 练习包

自己实现序列对求值。来自 Floorplanning · Lesson 6（Module 06）。这个练习也可以直接在模块页面的在线编程里完成，无需安装；这个包用于离线练习。

## 环境

Python 3.9 或更新版本，只用标准库。在任意空目录解压即可运行，不依赖课程仓库的其他文件。

## 文件

| 文件 | 用途 |
| --- | --- |
| `starter.py` | 起始代码：留有 TODO（`NotImplementedError`） |
| `check.py` | 检查器：逐项报告 PASS / FAIL / INCOMPLETE / ERROR / SKIP |
| `reference.py` | 参考实现：卡住时再看 |
| `fixtures/` | `sequence-pair.json` |

## 运行

```
python3 check.py              # 检查 starter.py（未完成的函数报 INCOMPLETE，不算通过）
python3 check.py reference.py # 参考实现应全部 PASS
python3 reference.py          # 看参考实现在本章例子上的输出
```

全部 PASS 时退出码为 0；有 FAIL、ERROR 或 INCOMPLETE 时为 1。SKIP 表示缺少可选依赖而未运行，不是通过。

**任务**（`starter.py`，五个函数）：

1. `validate_pair(pos, neg, ids)`：列出全部问题（缺、重、未知、长度不同）。
2. `relation(pos, neg, a, b)`：返回 `left` / `right` / `below` / `above`。
3. `build_graphs(pos, neg)`：返回水平边与竖直边，每对块恰好一条。
4. `longest_path(nodes, edges, size, rank)`：按拓扑序做 DP，取最大、加前驱尺寸。
5. `metrics(modules, outline, placement)`：完整、重叠（贴边不算）、溢出、包围盒、面积指标。

**提示一**：先只做两块的例子：pos = A B、neg = B A 时 A 在哪里？再推广到每一对。

**提示二**：DP 的每一步写成“候选 = 前驱坐标 + 前驱尺寸，取最大，再与 0 比较”。检查器会在 300 个随机序列对上验证每条边都成立、每块都压紧，并把全部 14,400 个五块序列对算一遍。

## 参考实现的输出（本包实际运行）

```
golden A B C E D | D A B C E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (0, 3), 'E': (7, 0)} bbox (9, 4) fits True
row A B C D E | A B C D E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (7, 0), 'E': (10, 0)} bbox (12, 3) fits False
stack A B C D E | E D C B A → {'A': (0, 0), 'B': (0, 2), 'C': (0, 5), 'D': (0, 7), 'E': (0, 8)} bbox (3, 10) fits False
twin A B C D E | D A B C E → {'A': (0, 0), 'B': (3, 0), 'C': (5, 0), 'D': (0, 3), 'E': (7, 0)} bbox (9, 4) fits True
tight A C D E B | C E A B D → {'A': (0, 0), 'B': (4, 1), 'C': (0, 2), 'D': (3, 0), 'E': (2, 2)} bbox (6, 4) fits True
```

## 说明

- 检查器同时检查本章的手算例子、300 个随机序列对和全部 14,400 个五块序列对，只记住答案无法通过。
- 例子与约定来自教师课程 learn_floorplanning（Floorplanning - Lesson 6，CC BY 4.0）。本练习包为本课新写，代码 MIT。
