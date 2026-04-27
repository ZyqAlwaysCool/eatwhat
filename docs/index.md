# 文档索引

本仓库使用分层文档来支撑 agent-first 开发。

## 阅读顺序

1. `AGENTS.md`
2. `docs/index.md`
3. `configs/agent-harness.yaml`
4. `docs/manifest.yaml`
5. `standards/` 下当前选中的 Pack 入口文档
6. `docs/current/` 中与当前任务相关的文档

## 控制模型

仓库控制模型分为三层：

- `Base`：跨项目稳定存在的仓库级控制规则，负责启动顺序、文档分层、脚本入口、验证要求和硬边界
- `Pack`：技术栈实现指导层，决定 `app/` 内部代码如何组织
- `Policy`：项目治理开关，定义在 `configs/agent-harness.yaml`

当前默认 Pack 为 `taro-react-fastapi`。
当前 Pack 入口文档为 `standards/taro-react-fastapi/README.md`。

## 文档分层

- `docs/current/`：当前真相
- `docs/adr/`：决策记录
- `docs/worklog/`：活跃讨论与调查笔记
- `docs/archive/`：退役内容

## 当前真相区域

- `docs/current/product/`
- `docs/current/architecture/`
- `docs/current/domain/`
- `docs/current/contracts/`
- `docs/current/runbooks/`

如果要理解 harness 控制模型本身，请阅读 `docs/current/architecture/harness-model.md`。

## 默认验证入口

- `./scripts/lint`
- `./scripts/typecheck`
- `./scripts/test`
- `./scripts/check`

## 默认技能注册表

见 `standards/skills/manifest.yaml`。
