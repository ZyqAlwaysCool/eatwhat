# 今天吃什么 API 当前契约

## 契约范围

本文件记录当前小程序前后端之间已经形成的 API 事实。

## 鉴权规则

除了健康检查与登录接口外，当前业务接口都需要带：

- `Authorization: Bearer <access_token>`

公开接口：

- `GET /health`
- `POST /auth/wechat/login`

受保护接口：

- `GET /auth/session`
- `GET /candidates`
- `POST /candidates`
- `GET /cuisines`
- `POST /cuisines`
- `POST /decisions/recommend`
- `GET /history`
- `POST /decisions/feedback`

## 登录契约

### `POST /auth/wechat/login`

请求体：

- `code`
- `client_device_id`

返回体：

- `access_token`
- `token_type`
- `expires_at`
- `user_id`

## 会话契约

### `GET /auth/session`

返回当前会话对应的：

- `user_id`
- `expires_at`
- `auth_provider`

## 店铺池契约

### `GET /candidates`

返回：

- `items`
- `total`

### `POST /candidates`

请求字段：

- `name`
- `note`
- `cuisine_ids`
- `taste_tag_ids`
- `scene_tag_ids`
- `budget_id`
- `dining_mode_ids`

说明：

- 同名候选项会做轻量去重

## 自定义品类契约

### `GET /cuisines`

返回：

- `items`
- `total`

### `POST /cuisines`

请求字段：

- `title`
- `description`
- `taste_tag_ids`
- `scene_tag_ids`
- `budget_id`
- `dining_mode_ids`

说明：

- 同标题自定义品类会做轻量去重

## 决策推荐契约

### `POST /decisions/recommend`

请求字段：

- `cuisine_ids`
- `taste_tag_ids`
- `scene_tag_ids`
- `budget_id`
- `dining_mode_ids`
- `exclude_candidate_ids`
- `exclude_cuisine_ids`

返回核心字段：

- `mode`
- `title`
- `description`
- `candidate`
- `cuisine`
- `rule_notes`
- `matched_cuisine_ids`
- `matched_taste_tag_ids`
- `applied_cuisine_ids`
- `applied_scene_tag_ids`
- `applied_budget_id`
- `applied_dining_mode_ids`

说明：

- `mode = candidate` 表示返回店铺结果
- `mode = empty` 在当前实现里既可能表示空结果，也可能表示返回方向结果
- 下一阶段如果要继续演进接口语义，应先做人类确认

## 历史反馈契约

### `GET /history`

返回：

- `items`
- `total`

### `POST /decisions/feedback`

请求字段：

- `action`
- `title`
- `description`
- `candidate`
- `cuisine`
- `applied_cuisine_ids`
- `matched_taste_tag_ids`
- `applied_scene_tag_ids`
- `applied_budget_id`
- `applied_dining_mode_ids`

当前支持的 `action`：

- `accepted`
- `skipped`
- `disliked`
- `ate_recently`
- `too_expensive`

## 当前契约注意事项

- 当前契约已经服务于真实小程序页面，不应在下一阶段被随意重写
- 如果要改公开 API 结构，应先更新本文档并获得人类确认
