# 结构标准

## 目标

让小程序前端与后端代码边界清晰，可被 Codex 稳定理解与维护。

## 推荐目录

在当前仓库中，业务代码仍然必须放在 `app/` 下。

推荐从以下结构开始：

- `app/miniapp/`
- `app/api/`
- `app/shared/`

进一步细化后可演进为：

- `app/miniapp/pages/`：小程序页面
- `app/miniapp/components/`：可复用前端组件
- `app/miniapp/features/`：按业务能力组织的前端模块
- `app/miniapp/store/`：前端状态管理
- `app/miniapp/services/`：前端请求封装与平台能力调用
- `app/miniapp/styles/`：样式入口与设计令牌
- `app/api/routes/`：FastAPI 路由
- `app/api/schemas/`：接口请求与响应模型
- `app/api/services/`：后端应用服务
- `app/api/domain/`：核心领域模型与规则
- `app/api/repositories/`：持久化适配层
- `app/shared/`：前后端共享常量、枚举、标签定义

## 边界要求

- 小程序页面只负责展示、交互和页面编排
- 前端业务规则应集中在 `features` 或规则模块，不要散落在页面 JSX 中
- 后端路由保持轻量，只负责参数校验、调用服务和返回结果
- 标签定义、筛选规则、抽选算法应与 UI 解耦
- AI 辅助能力必须与基础规则链路解耦

## 默认原则

- 先用最小可读结构
- 不要提前拆出过多层级
- 只有在职责已经明显增多时再继续细化
