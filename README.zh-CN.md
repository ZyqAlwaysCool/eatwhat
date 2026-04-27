# Agent Harness

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Agent Harness` 是一个面向 agent-first 软件开发的仓库初始化模板。它提供的不是完整知识，而是一套受控的软件工程环境，使 agent 在持续迭代中尽量避免理解漂移，并对抗知识与流程的熵增问题，从而在保持人类掌舵的前提下，尽可能降低人工微观干预。

当前仓库的 v0.1 初版由 GPT-5.4 在对话协作中完成搭建。它同时吸收了两类来源：一类是作者此前在 agent 主导的 vibe coding 项目实践中暴露出的真实问题，另一类是 OpenAI 关于 harness engineering 的文章思想。

一个直观的理解方式是：模型像一台高性能发动机。只有当它被安装在结构完整、边界清晰、轨道明确的工程系统中时，自动驾驶式的协作开发才真正具备稳定性。

当前模板已切换到 `Taro + React + TypeScript + Tailwind CSS + FastAPI` 这一套适合微信小程序前后端协作的技术栈。你仍然可以基于项目需求继续替换或扩展对应的 Pack 与 Policy。

> Agent Harness 提供的不是完整知识，而是知识从混沌生长到稳定的受控轨道。

## 为什么要做这个

现代编码模型已经非常强大，但模型能力本身并不会自然导向稳定的软件交付。缺少结构约束时，项目很容易出现这些问题：

- 当前真相与临时记录混杂在一起
- 每次新会话都要重新建立上下文
- 验证依赖人工反复提醒
- 高影响改动容易发生在错误边界内

Agent Harness 的目标，就是把 harness engineering 的思想真正落实到代码仓库中。

它把仓库视为 agent 的控制面：

- 仓库结构是轨道
- 文档分层是记忆控制
- 固定脚本是执行入口
- 验证闭环是仪表盘
- 人工确认边界是护栏

参考文章：

- OpenAI，《Harness engineering: using Codex in an agentic world》
  https://openai.com/zh-Hans-CN/index/harness-engineering/

## 核心模型

这个仓库的控制模型分为三层：

- `Base`：跨项目稳定存在的仓库级控制规则
- `Pack`：与技术栈相关的实现指导层
- `Policy`：定义在 [`configs/agent-harness.yaml`](./configs/agent-harness.yaml) 中的项目治理开关

当前默认的 Pack 是 `taro-react-fastapi`。

## 仓库提供了什么

- [`AGENTS.md`](./AGENTS.md)：agent 的启动地图
- [`docs/`](./docs)：分层知识系统，其中 `docs/current/` 是当前事实真相层
- [`app/`](./app)：唯一业务代码根目录
- [`scripts/`](./scripts)：稳定的 setup、开发、验证、replay 入口
- [`standards/`](./standards)：Base 与 Pack 层标准
- [`configs/agent-harness.yaml`](./configs/agent-harness.yaml)：项目级 Policy 开关
- [`standards/skills/manifest.yaml`](./standards/skills/manifest.yaml)：仓库控制面使用的 Skills 声明

## 如何开始使用

### 1. 先调整控制面，再进入业务实现

基于模板创建新项目后，建议先调整控制面，而不是立即让 agent 写业务代码。

典型步骤：

1. 重命名项目，并修改 [`configs/agent-harness.yaml`](./configs/agent-harness.yaml)
2. 阅读并调整 [`AGENTS.md`](./AGENTS.md)，让它保持“启动地图 + 硬边界”的角色
3. 判断默认的 `taro-react-fastapi` Pack 是否适合当前项目；若不适合，则定义自己的技术栈规范或替换相应 Pack
4. 根据需要调整 Policy、文档结构和脚本
5. 运行 `./scripts/setup`

### 2. 第一次对话：先理解轨道，再讨论需求

对于一个全新的项目，第一次和 agent 的对话不建议直接进入实现。

更合理的顺序是：

1. 先让 agent 读取控制面并总结仓库模型
2. 再与 agent 对齐项目需求、范围和约束
3. 如果 `app/` 内部结构尚未确定，让 agent 提出结构建议
4. 由开发者确认结构和第一批 current truth 文档
5. 然后再进入实现

第一次对话通常应该是：

**仓库理解 + 需求澄清**，而不是直接写代码。

### 3. 让知识分层生长

项目初期需求不完整、架构未定型是正常状态。关键不是一开始把文档写满，而是把知识放到正确层级：

- `docs/worklog/`：活跃讨论与临时记录
- `docs/current/`：已确认的当前真相
- `docs/adr/`：重要决策
- `docs/archive/`：已废弃材料

重点不是“多写文档”，而是“不要把不同状态的知识混在一起”。

## 标准工作流：先定轨道，再进研发

推荐把一个新项目的启动过程拆成两个阶段。

### Stage A：Bootstrap Session

第一轮会话的目标不是直接研发业务功能，而是把通用模板改造成“当前项目的受控模板”。

在这个阶段，agent 主要负责：

- 与你讨论需求、范围和约束
- 沉淀 `docs/worklog/`、`docs/current/`、`docs/adr/` 中的初始内容
- 将默认 Pack 替换成当前项目真实需要的技术栈 Pack
- 调整 `scripts/` 以匹配当前项目的执行与验证方式
- 根据需要调整 Policy
- 在项目结构尚未明确时，提出 `app/` 内部结构方案并等待确认

当这个阶段结束时，仓库已经不再是一个通用模板，而是一个已经切换到当前项目轨道的受控环境。

### Stage B：Delivery Session

第二轮会话再进入正式研发。

这时新的 agent 会话面对的，不再是一个抽象模板，而是一个已经明确了以下内容的项目仓库：

- 当前 truth 在哪里
- 当前使用哪个 Pack
- 当前 Policy 是什么
- 当前验证入口是什么
- 当前代码结构边界是什么

在这个基础上再进入功能研发、测试与交付，稳定性会明显更高。

### 为什么要分成两阶段

因为“构建控制面”和“在控制面内研发”本质上不是同一种工作。

- 第一阶段是在铺轨、定边界、固化真相
- 第二阶段是在既定轨道上持续交付

先定轨道，再开新会话进入研发，是 Agent Harness 推荐的标准使用方式。

## 如何修改这个框架

这个模板本来就是允许被修改和演进的。

推荐的修改方式是：

- 修改 `Base`：调整仓库控制哲学
- 修改 `Pack`：适配新的技术栈或代码组织方式
- 修改 `Policy`：调整 agent 自主程度和治理强度
- 修改 `scripts/` 实现：增强执行方式，但尽量保持入口名稳定

也就是：

- 用 `Base` 控制理解漂移
- 用 `Pack` 适配技术栈
- 用 `Policy` 调整治理方式

## 默认验证闭环

默认的总验证入口是：

```bash
./scripts/check
```

默认开发路径是：

```bash
./scripts/setup
./scripts/dev
./scripts/check
```

目标是让 agent 默认能够完成“实现 -> 验证 -> 交付”的闭环，而不是停留在代码生成阶段。

## 演进方向

这个仓库本身就是一个持续迭代的框架，而不是一次性定型的规范包。

当前的计划是：

1. 先把这套框架应用到一个真实的新项目里
2. 让 GPT-5.4、Claude Code 等 agent 在这套受控环境里开发项目
3. 观察它在哪些地方有效，哪些地方仍然会漂移
4. 基于真实使用体验继续优化框架
5. 持续循环

这很重要，因为 Agent Harness 不应该只靠抽象讨论来设计，它必须经受真实项目迭代压力下的检验。

## 近期重点

后续的优化大概率会来自真实项目实践，尤其包括：

- 更完整的 Pack 细则
- 更好的 replay 与调试能力
- 更锋利的人类接管边界
- 更清晰的 Skills 声明与集成方式
- 更稳定的 agent 交付验证契约

## 快速开始

```bash
./scripts/setup
./scripts/dev
./scripts/check
```

## 当前状态

当前版本是一个 v0.1 的 agent-first 起点。它的仓库控制模型并不与某一种前端或后端技术强绑定，但当前默认 Pack 已切换为 `taro-react-fastapi`，用于支持微信小程序 + Python API 的项目启动。
