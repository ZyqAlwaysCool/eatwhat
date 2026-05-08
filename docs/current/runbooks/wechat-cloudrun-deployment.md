# 微信云托管部署运行手册

## 目标

指导当前项目将 `app/api` 以 Docker 方式部署到微信云托管，并让小程序通过 `callContainer` 联通后端。

## 后端部署对象

- 服务代码：`app/api`
- 镜像入口：`app/api/Dockerfile`
- 健康检查：`GET /health`

## 必需环境变量

### 后端（云托管服务）

- `APP_ENV=production`
- `DATABASE_URL`（必需，必须指向托管 MySQL）
- `WECHAT_LOGIN_MODE=official`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `AUTH_SESSION_TTL_HOURS`（可选，默认 720）
- `WECHAT_REQUEST_TIMEOUT_SECONDS`（可选，默认 5）

说明：

- 生产环境缺少 `DATABASE_URL` 时，服务会拒绝启动；
- 生产环境不允许回落到容器本地 SQLite；
- `MEAL_DECISION_DB_PATH` 仅本地 SQLite fallback 使用。

### 前端（小程序）

- `MEAL_DECISION_USE_CALL_CONTAINER=true`
- `MEAL_DECISION_CLOUDRUN_SERVER=<云托管服务名>`
- `MEAL_DECISION_CLOUDRUN_ENV=<云托管环境标识>`

可选：

- `MEAL_DECISION_API_BASE_URL`（仅域名 fallback 方案使用）

说明：

- 构建时会注入为 `TARO_APP_USE_CALL_CONTAINER`、`TARO_APP_CLOUDRUN_SERVER`、`TARO_APP_CLOUDRUN_ENV`；
- 小程序必须先与目标云开发环境完成关联，`callContainer` 才能正常调用服务。

## 启动与端口

当前容器启动命令支持读取云托管注入端口：

- `PORT` 存在时：按 `PORT` 启动
- `PORT` 不存在时：回落 `8000`

## 推荐上线顺序

1. 本地通过 `./scripts/check`
2. 构建并部署 `app/api` 到微信云托管
3. 在云托管中创建/绑定 MySQL，并配置后端环境变量（含 `DATABASE_URL`）
4. 在微信后台确认小程序与目标云开发环境已关联
5. 小程序配置 `callContainer` 并上传体验版
6. 真机验证核心链路
7. 提交审核并发布

## 真机验证清单

- 首次进入是否自动登录成功
- `/auth/wechat/login` 是否返回会话
- 候选池新增后是否仅当前用户可见
- 历史记录写入后是否仅当前用户可见
- 推荐接口是否可返回 candidate/empty 模式
- 会话过期后是否自动重登

## 回滚建议

- 保留上一个可用镜像版本
- 出现生产故障时优先回滚镜像，再排查数据库与配置
- 数据迁移前务必导出快照，避免不可逆变更
