# 今天吃什么领域模型草案

## 核心实体

- `User`：使用产品做吃饭决策的人
- `Participant`：参与当前决策的人，单人场景下可以与 `User` 相同
- `DecisionGroup`：一次决策所涉及的参与者集合，第一版默认支持单人，可扩展到多人
- `CuisineCandidate`：品类候选，例如火锅、烤肉、炒菜、汉堡
- `RestaurantCandidate`：店铺候选，可以由用户手动创建，后续也可以来自位置或外部来源。第一版允许使用用户自定义简称或昵称，不要求平台级标准店名
- `DecisionSession`：围绕某一顿饭展开的一次决策过程
- `DecisionConstraints`：过滤条件，例如预算、距离、营业状态、外卖或到店、忌口
- `DecisionResult`：本次最终生成的推荐结果
- `FeedbackSignal`：用户对结果给出的反馈，例如接受、跳过、不喜欢、最近刚吃过

## 初始关系

- 一个 `User` 可以发起多个 `DecisionSession`
- 一个 `DecisionSession` 属于一个 `DecisionGroup`
- 一个 `DecisionGroup` 包含一个或多个 `Participant`
- 一个 `DecisionSession` 可以包含多个 `CuisineCandidate`
- 一个 `DecisionSession` 可以包含多个 `RestaurantCandidate`
- 一个 `DecisionSession` 最多有一个最终 `DecisionResult`
- 一个 `DecisionResult` 可以产生多个 `FeedbackSignal`

## 领域不变量

- 一次决策必须足够轻量，不能比原始纠结过程更重
- “吃什么”和“去哪家吃”是相关但不同层级的问题
- 第一版应优先保证可用性，而不是追求复杂智能
- 被连续拒绝的候选项不应持续高频出现
- 用户维护的候选池是长期资产，不是一次性输入
- 候选池中的店铺名称应以用户可识别为准，而不是以平台标准化为准

## 状态草图

建议的决策状态：

- `draft`：正在录入候选项或条件
- `ready`：信息足够，可以生成结果
- `generated`：系统已经给出推荐结果
- `accepted`：用户接受结果
- `rerolled`：用户要求重新生成
- `closed`：本次决策结束

## 后续扩展关注点

- 单人效率与多人协同之间的平衡
- 随机性与用户信任之间的平衡
- 输入成本与结果质量之间的平衡
- 本地私有数据与外部店铺数据之间的平衡
