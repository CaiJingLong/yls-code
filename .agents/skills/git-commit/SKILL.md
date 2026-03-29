---
name: git-commit
description: 'Use when drafting, revising, or applying Git commit messages in this repository, especially when choosing Conventional Commit type/scope and matching chanjet commit-history conventions.'
---

# Chanjet Git Commit

适用于本仓库内所有与提交说明相关的操作，包括：

- 为当前改动拟定提交说明
- 改写已有提交说明
- 执行 `git commit`、`git commit --amend`
- 判断某个改动该用什么 `type` / `scope`

## 提交说明格式

默认使用 Conventional Commit 风格，且优先贴近本仓库已有历史：

```text
<type>: <summary>
```

只有在 `scope` 能明显提升定位效率时，才使用：

```text
<type>(<scope>): <summary>
```

首行规则：

- 默认首行只写一行 summary，正文另起段落
- 首行优先控制在 72 个字符以内
- summary 默认使用中文
- 不要加句号、代码块标记或额外解释前缀

除非改动极小且一行足够说清，否则默认追加正文：

```text
<type>: <summary>

- 变更点一
- 变更点二
```

正文规则：

- 默认大多数提交都带正文；只有非常小、单一且无需补充上下文的改动，才可以只写首行
- 正文优先概括 2-5 个最重要的改动点，而不是机械罗列所有文件
- 正文使用中文平铺列表，一行一个要点
- 文件名、命令、路径用反引号包裹，如 `` `dev.py` ``
- 每个要点优先写“结果/行为变化”，再决定是否补实现细节
- 不要把多个不相关主题硬塞进一个长正文；应优先拆分提交

适合只写首行的少数场景：

- 只改一个非常单一的小 bug，且无需补充原因或影响面
- 只补一个极小忽略项、文案错字或注释修正
- 只做一条非常明确的机械性调整，正文只会重复首行

## Type 选择

- `feat`：新增功能、页面、接口、共享能力
- `fix`：修复 bug、回归、错误行为
- `refactor`：重构或收敛实现，不以新增功能为主
- `docs`：文档、说明、流程约束、agent/skill 指引
- `style`：纯样式、格式、排版、空白、lint 风格整理，不涉及行为变化
- `test`：测试、夹具、回归覆盖
- `chore`：杂项维护、忽略项、仓库整理
- `build`：构建、打包、依赖工具链
- `perf`：性能优化
- `ci`：CI/CD 流程

不要同时堆多个 type。若改动横跨多类，按“本次提交最主要的目的”选一个。

## Scope 选择

本仓库历史里，大多数提交默认不带 scope；不要为了“更规范”强行补一个。

仅在 scope 能明显帮助定位改动范围时使用。

- 常见 scope：`finance-desk`、`dev`、`dev-picker-agent`
- 如果改动已经足够聚焦，且加 scope 只会重复标题信息，则省略
- 如果 scope 只是文件名、目录名重复，通常也省略
- 不要为了“看起来规范”硬加宽泛 scope
- 除非用户明确要求，否则默认先写无 scope 版本，再判断是否需要补 scope

## Summary 写法

- 默认优先中文，保持和当前仓库主提交历史一致
- 若目标内容本身以英文为主，或英文表达明显更自然，可使用英文
- 使用动作导向、接近祈使语气的短语，直接写“做了什么”
- 优先写结果，不要罗列实现细节
- 长度保持精炼，通常一句话说清主变化即可
- 常用动词：`新增`、`修复`、`重构`、`优化`、`统一`、`补充`、`收敛`、`移除`、`忽略`、`记录`
- 不要写成空泛描述，如 `update code`、`fix bug`、`修改一些问题`
- 不要在 summary 末尾加句号
- 不要把“并修复若干问题”“调整一些细节”这类模糊说法当 summary

优先写法示例：

- `fix: 修复 finance-desk dev 启动链路`
- `refactor: 拆分 finance-desk dev runner 并增强启动回收链路`
- `chore: 忽略仓库根本地 .venv 目录`

## 提交前检查

在生成或改写提交说明前，先确认实际改动范围：

1. 先看 `git diff --cached --stat`，提交说明必须以“已暂存内容”为准
2. 如需补充上下文，再看 `git diff --cached`
3. 若没有 staged changes，不要编造提交说明；应先提示用户当前没有已暂存改动
4. 不要为未暂存改动写说明，也不要把工作区其他改动混进提交描述
5. 若发现一个提交里混入多个不相关主题，优先建议拆分提交
6. 若是在改写历史提交说明，新的 summary 必须反映真实 diff，而不是沿用旧描述

## 参考样式

贴近本仓库历史的写法示例：

- `refactor: 拆分 finance-desk dev runner 并增强启动回收链路`
- `fix: 统一 finance-desk 本地 Playwright 安装入口`
- `feat(finance-desk): 新增输出台账导入与查询接口`
- `docs(finance-desk): 固定 web UI 设计系统与页面规范`
- `test: add gs add command coverage`

带正文的示例：

```text
fix(dev): 修复 finance-desk up 关闭后的子进程残留

- 让前台 `up` 模式接管 `SIGHUP` 并走受控停机
- 为 `run_manager` 补充对应回归测试
```

默认正文风格示例：

```text
fix: 统一 finance-desk 本地 Playwright 安装入口

- 在 workspace 根新增本地 Playwright 安装与版本检查入口
- 调整相关 package 与 routes 复用同一错误提示
- 补充回归测试并更新 README 与实施状态说明
```

## 输出约束

若用户只是让你“给提交说明”而不是立刻执行提交：

- 默认直接给出“首行 + 正文”的完整 commit message 文本
- 若判断本次改动极小、正文没有增量信息，才只输出首行
- 若需要正文，按 Conventional Commit 标准输出完整文本
- 不要额外包代码块，除非用户明确要求
- 不要附带“这里是提交说明”“你可以使用下面内容”之类前缀

若用户明确指定提交说明格式或语言，优先遵循用户要求；否则按本 skill 执行。
