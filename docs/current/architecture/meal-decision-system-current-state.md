# 今天吃什么系统当前状态

## 当前系统形态

当前仓库已经形成一个前后端双工程结构：

- 小程序前端：`app/miniapp`
- FastAPI 后端：`app/api`

当前不再是纯控制面仓库，而是已经进入可运行的业务开发阶段。

## 当前前端事实

前端当前固定为：

- Taro 4
- React 18
- TypeScript
- Tailwind CSS
- pnpm 管理依赖

当前小程序工程根目录是：

- `app/miniapp`

微信开发者工具应导入：

- `app/miniapp`

当前微信工程关键事实：

- `project.config.json` 已存在
- `miniprogramRoot` 指向 `dist/`
- 当前基础库版本配置为 `3.15.1`

## 当前后端事实

后端当前固定为：

- Python
- FastAPI
- uv 管理依赖与运行

当前后端工程根目录是：

- `app/api`

当前后端已经具备：

- 健康检查
- 店铺池 API
- 自定义品类 API
- 决策推荐 API
- 历史反馈 API
- 微信登录 API

## 当前数据层事实

当前 V0 已切换为可配置数据层：

- 生产必需：MySQL（通过 `DATABASE_URL` 配置）
- 本地默认：SQLite fallback（用于快速联调）

当前后端仍保留旧 JSON 兼容字段来源：

- `app/api/data/candidates.json`
- `app/api/data/cuisines.json`
- `app/api/data/history.json`

这些旧 JSON 主要承担一次性迁移入口角色，不再是推荐的长期主存储。

## 当前运行入口

仓库当前统一运行入口保持为：

- `./scripts/setup`
- `./scripts/dev`
- `./scripts/check`

当前约定：

- `./scripts/dev miniapp`：启动 Taro 微信小程序 watch
- `./scripts/dev api`：启动 FastAPI 本地服务
- `./scripts/dev all`：同时启动前后端

## 当前环境变量事实

### 前端

- `MEAL_DECISION_API_BASE_URL`

该变量会被注入为：

- `TARO_APP_API_BASE_URL`

### 后端

- `APP_ENV`
- `DATABASE_URL`
- `MEAL_DECISION_DB_PATH`
- `WECHAT_LOGIN_MODE`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `AUTH_SESSION_TTL_HOURS`
- `WECHAT_REQUEST_TIMEOUT_SECONDS`

其中：

- `DATABASE_URL`：生产环境主数据源（必需指向 MySQL）
- `MEAL_DECISION_DB_PATH`：仅作为本地 SQLite fallback

## 当前鉴权与隔离事实

当前已经接入：

- 微信小程序登录入口
- 后端自签会话
- 用户级数据隔离

更详细说明见：

- `docs/current/architecture/wechat-auth-and-user-isolation.md`

## 当前部署状态判断

当前系统已经满足“部署前联调阶段”的基本要求：

- 前后端都可独立启动
- 后端可容器化
- 小程序端可在开发者工具中运行
- 已有用户体系与数据隔离

但当前还未完成的线上必要条件包括：

- 微信云托管环境与服务创建
- 小程序与目标云环境关联
- 小程序 `callContainer` 联通验证
- 正式 `code2Session` 联调
- 线上 MySQL 与备份策略
