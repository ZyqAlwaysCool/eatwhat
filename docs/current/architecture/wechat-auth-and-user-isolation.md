# 微信鉴权与用户隔离方案

## 目标

为“今天吃什么”小程序接入官方推荐的小程序登录链路，并让每个用户拥有独立的：

- 店铺池
- 自定义品类池
- 决策历史与反馈

当前实现已经落在仓库代码中。

## 当前采用的官方链路

当前采用微信小程序官方推荐的登录方式：

1. 小程序端调用 `wx.login` / `Taro.login`
2. 前端把临时 `code` 发给后端 `/auth/wechat/login`
3. 后端调用微信 `code2Session`
4. 后端拿到 `openid`，可选拿到 `unionid`
5. 后端生成系统内 `user_id`
6. 后端签发自己的会话 `access_token`
7. 后续业务请求统一通过 `Authorization: Bearer <token>` 访问

这里的关键点是：

- 小程序拿不到“微信号字符串”，当前系统不依赖微信号
- 微信侧唯一身份使用 `openid`
- 系统侧唯一身份使用后端生成的 `user_id`
- `unionid` 作为增强字段保留，不作为第一版强依赖

## 数据模型

当前 SQL 数据层中包含三类鉴权表（生产推荐 MySQL）：

- `users`
- `wechat_accounts`
- `auth_sessions`

### `users`

- `id`
- `status`
- `created_at`
- `last_login_at`

### `wechat_accounts`

- `id`
- `user_id`
- `app_id`
- `openid`
- `unionid`
- `created_at`
- `last_login_at`

约束：

- `(app_id, openid)` 唯一

### `auth_sessions`

- `id`
- `user_id`
- `token_hash`
- `created_at`
- `expires_at`
- `last_used_at`

说明：

- 服务端不保存明文 token，只保存 `token_hash`
- 前端只保存后端自签的会话 token
- `session_key` 不返回前端，也不落业务存储

## 业务数据隔离

当前三张业务表都已经加入 `owner_user_id`：

- `candidates.owner_user_id`
- `cuisines.owner_user_id`
- `history_log.owner_user_id`

约束如下：

- 前端不上传 `owner_user_id`
- 路由层通过当前登录态解析出 `CurrentUser`
- Service / Repository 只按 `CurrentUser.user_id` 读写数据
- 因此用户之间不会互相看到彼此的店铺池、历史记录或自定义品类

## 旧本地数据迁移

为了兼容接账号体系之前的单机本地数据，当前实现保留了一次性迁移逻辑：

- 老 JSON / SQLite 全局数据会先挂到 `legacy-local-user`
- 首个真实登录用户访问对应业务表时，会一次性接管这批旧数据
- 接管后数据正式归属该用户

这个逻辑主要用于本地升级过渡，不应作为正式共享逻辑理解。

## 前端实现

当前小程序端已经实现：

- 启动时静默登录
- 请求前自动确保已有有效会话
- 收到 `401` 时自动清空旧会话并重登一次
- 所有业务请求默认自动带 `Authorization` 头

关键文件：

- `app/miniapp/src/services/auth.ts`
- `app/miniapp/src/services/http.ts`
- `app/miniapp/src/app.ts`

## 后端实现

关键文件：

- `app/api/routes/auth.py`
- `app/api/services/auth.py`
- `app/api/integrations/wechat.py`
- `app/api/dependencies/auth.py`
- `app/api/repositories/auth.py`

业务路由已经全部切到登录态保护：

- `/candidates`
- `/cuisines`
- `/decisions/recommend`
- `/history`
- `/decisions/feedback`

公共路由当前仍保留：

- `/health`
- `/auth/wechat/login`

## 环境变量

### 后端

- `WECHAT_APP_ID`：微信小程序 AppID
- `WECHAT_APP_SECRET`：微信小程序 AppSecret
- `WECHAT_LOGIN_MODE`：`official` 或 `mock`
- `AUTH_SESSION_TTL_HOURS`：后端会话有效期，默认 `720`
- `DATABASE_URL`：SQL 数据库连接地址（生产必需指向 MySQL）
- `MEAL_DECISION_DB_PATH`：本地 SQLite fallback 路径

### 前端

- `MEAL_DECISION_API_BASE_URL`：小程序访问后端的基础地址
- `MEAL_DECISION_USE_CALL_CONTAINER`：是否启用云托管 `callContainer`
- `MEAL_DECISION_CLOUDRUN_SERVER`：云托管服务名
- `MEAL_DECISION_CLOUDRUN_ENV`：云托管环境标识

当启用 `callContainer` 时，前端会优先走微信云托管私有协议。

## 本地开发说明

当前为了保证本地联调和自动化测试可用，保留了开发态 `mock` 登录模式：

- `WECHAT_LOGIN_MODE=mock`
- 不调用真实微信接口
- 使用本机持久化的 `client_device_id` 生成稳定 `openid`

正式环境必须切回：

- `WECHAT_LOGIN_MODE=official`
- 并正确提供 `WECHAT_APP_ID` 与 `WECHAT_APP_SECRET`

## 云托管部署结论

当前代码已经适配微信云托管容器部署：

- 后端容器启动端口支持读取 `PORT`（默认回落 `8000`）
- 后端启动时会自动完成表结构准备
- 生产环境缺失 `DATABASE_URL` 或仍使用 SQLite 时会拒绝启动
- 小程序端支持 `callContainer` 私有协议访问
- 生产数据层要求 `DATABASE_URL` 指向 MySQL

如果继续使用公网域名模式，仍需要遵循微信合法域名规则；如果走 `callContainer`，可减少公网域名依赖。

## 当前安全边界

当前实现遵循以下边界：

- 前端不直接调用 `code2Session`
- 前端不保存 `AppSecret`
- 前端不接触 `session_key`
- 后端不相信前端传入的用户 ID
- 业务数据只从后端登录态解析当前用户
- 服务端会话采用随机 token + hash 落库

## 后续建议

当前实现已经满足 V0 的用户隔离与正式登录主链路，后续建议继续补：

- 登出接口
- 会话回收与设备管理
- SQLite 到 PostgreSQL 的迁移脚本
- 小程序真机域名联调手册
- 更细粒度的审计日志
