# 小程序初始化运行手册

## 目标

定义当前项目推荐的小程序初始化方式，避免在“用微信开发者工具新建”还是“用 Taro 创建”之间反复摇摆。

## 当前结论

当前项目的前端初始化应以 Taro CLI 为主，而不是以微信开发者工具原生模板为主。

推荐流程：

1. 使用 Taro CLI 初始化小程序前端项目
2. 将前端代码放入 `app/miniapp`
3. 将后端 `uv` 项目放在 `app/api`
4. 在 `app/miniapp` 中执行 `pnpm dev:weapp`
5. 使用微信开发者工具导入 `app/miniapp` 项目根目录进行预览

## 为什么不以开发者工具模板为主

- 当前项目前端技术栈已确定为 `Taro + React + TypeScript`
- 如果先用原生模板创建，再改造成 Taro，结构会更乱
- 对 Codex 来说，统一源码结构更容易理解和维护

## 微信开发者工具在这个流程中的角色

微信开发者工具仍然是必须工具，但它的角色是：

- 导入项目
- 预览编译结果
- 模拟器调试
- 真机验证
- 平台上传相关操作

而不是本项目主初始化入口。

## 参考命令

前端初始化：

```bash
npx @tarojs/cli init app/miniapp
```

前端开发：

```bash
cd app/miniapp
pnpm dev:weapp
```

后端开发：

```bash
cd app/api
uv sync --dev
uv run uvicorn app.api.main:app --reload
```

## 注意事项

- 按 Taro 官方文档，微信开发者工具预览应选择项目根目录
- 小程序平台设置项仍需在微信开发者工具中检查
- 初始化后应尽快纳入根脚本统一管理
- 当前仓库的 Taro 4 建议使用 `Node.js 20 LTS`
- 如果本机 Node 版本过高，例如 `v25`，`pnpm dev:weapp` 与 `pnpm build:weapp` 会被脚本直接拦截并提示先切换版本
