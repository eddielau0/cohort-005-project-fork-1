# Cadence V1 应用内通知的 Knock 选型研究

核查日期为 2026 年 11 月 26 日。依据 Knock 官方文档、公开定价、官方 SDK 源码及 Cadence 仓库快照。真实账号端到端验证尚待进行。

## 选型结论

**建议在 Web V1 规格中采用 Knock。** 官方资料覆盖按用户托管通知列表、未读总数、持久化已读状态以及自定义 Web 界面。Cadence 决定业务事件何时触发、哪些用户收到通知、通知如何呈现及点击后能访问什么。资料核查未发现需要另查托管供应商的关键能力缺口。真实用户上线前须接入可信的 Cadence 登录会话，并通过下文的环境与行为验收。[Knock Feeds](https://docs.knock.app/in-app-ui/feeds/overview) · [React 自定义通知界面](https://docs.knock.app/in-app-ui/react/headless/feed)

## Web 集成、消息状态与跳转

- **与现有 SSR 的接点。** Cadence 声明 React `^19.2.7`、React Router `8.3.0`，启用了 SSR。共享应用布局中的 loader 已按请求取得用户，布局负责导航和页面出口，可提供通知入口与用户上下文。建议服务器渲染相同的初始通知界面，浏览器完成 hydration 后挂载用户专属的 Knock Feed 并建立网络连接。Knock 的通用 React SDK 提供 headless hooks，官方包声明支持 React 19。React Router 这套 SSR 构建和 hydration 行为仍需实测。若规格后来要求在 SSR HTML 中就显示未读数，官方 Feed REST API 也允许由 Cadence 服务端为当前用户读取，并将数据交给客户端接管。[依赖](../../package.json) · [SSR 配置](../../react-router.config.ts) · [应用布局](../../app/routes/layout.app.tsx) · [Knock React 集成](https://docs.knock.app/in-app-ui/react/headless/feed) · [Knock React SDK 包声明](https://github.com/knocklabs/javascript/blob/main/packages/react/package.json) · [Feed 列表 API](https://docs.knock.app/api-reference/users/feeds/list_items)
- **列表和计数。** `@knocklabs/react` 的 `useNotifications` 和 `useNotificationStore` 提供通知条目、游标分页和 `metadata.unread_count`。可用同一用户的同一 in-app channel 驱动铃铛、弹出列表或独立页。Knock 区分 `unseen`、`seen` 与 `read`，预制铃铛默认显示未查看数。若规格要求未读数，直接绑定 `unread_count`，并按交互规格调用 `markAsRead()` 或 `markAllAsRead()`。全部已读会先更新本地视图，服务端批量处理可能延迟。打开列表是否改变状态、何时标记已读、加载与失败如何呈现，均由 Cadence 决定。[通知状态](https://docs.knock.app/integrations/in-app/feeds) · [通知 Store](https://docs.knock.app/in-app-ui/react/sdk/hooks/use-notification-store) · [Feed 客户端](https://docs.knock.app/in-app-ui/javascript/sdk/feed-client)
- **状态同步。** Knock 保存消息状态，重新读取 Feed 可取得持久化结果。SDK 管理新通知的 WebSocket 投递和重连。React SDK 的 `__experimentalCrossBrowserUpdates` 使用 BroadcastChannel 协调同浏览器标签页或窗口。跨设备已读变更的即时传播仍需实测。V1 可把重新打开通知、前台恢复或重连后的重新读取作为同步验收点。部署时按 SDK 文档检查 `connect-src` 是否允许所用 Knock 主机。[Feed API 和实时服务](https://docs.knock.app/in-app-ui/api-overview) · [React 的 Socket 选项](https://docs.knock.app/in-app-ui/react/feed#socket-behavior-options) · [Knock 安全与认证](https://docs.knock.app/in-app-ui/security-and-authentication)
- **点击去向。** 工作流的 `data` 可传应用内路由所需的少量字段，Knock 通知模板也支持 `action_url`。自定义界面可用 Cadence 的导航处理交互，目的页 loader 继续按当前用户检查权限。默认 compact Feed 会省略嵌套 `data`，因此优先用平坦字段。通知正文和元数据发送后固定，业务状态以目标页为准。既有路由包括课程课节、讲师问答、平台退款管理和团队页，具体事件应落到当前收件人有权限访问的位置。[Knock 点击交互](https://docs.knock.app/in-app-ui/feeds/handling-interactivity) · [Feed 数据模式](https://docs.knock.app/in-app-ui/react/headless/feed) · [Feed 内容更新规则](https://docs.knock.app/in-app-ui/feeds/overview) · [Cadence 路由](../../app/routes.ts)

## 账号隔离与通知发送

- **用户身份。** 在当前数据库与环境内，可将已验证的 `users.id` 转为字符串，统一作为 Knock 用户 ID、发送收件人 ID 和 JWT 的 `sub`。应用服务端验证会话对应用户后才签发短期 RS256 JWT。生产启用 Enhanced Security，将客户端 token 的权限限制于该用户的 `user/feed_read` 和 `user/feed_write`，浏览器仅取得 publishable key、in-app channel ID 与该用户的 token。工作流 secret key 与签名私钥留在服务端。切换用户或登出时，用新的用户上下文替换旧 Feed 实例并清除旧状态。若规格需要团队级 Feed，再用 `tenant` 同时限制工作流、Feed 和 JWT 授权，并由 Cadence 验证团队成员关系。[用户表](../../app/db/schema.ts) · [会话](../../app/lib/session.ts) · [Knock 安全与认证](https://docs.knock.app/in-app-ui/security-and-authentication) · [租户隔离](https://docs.knock.app/multi-tenancy/tenant-scoping)
- **真实用户前提。** 仓库当前的课程开发会话采用模拟登录和 Dev UI 用户切换。真实用户使用前，签发 Knock token 的入口须接入可信的 Cadence 身份验证，且开发切换功能仅在隔离环境可用。Knock 通过服务端签发的 token 执行用户隔离，业务身份由 Cadence 建立。[Cadence 登录](../../app/routes/login.tsx) · [开发用户切换](../../app/routes/api.switch-user.ts) · [Knock 安全与认证](https://docs.knock.app/in-app-ui/security-and-authentication)
- **发送与幂等。** Cadence 服务端在业务写入成功后计算收件人，经 `@knocklabs/node` 或 REST API 触发配置了 in-app channel 的工作流。Knock 支持引用已识别的用户，也支持在同一触发请求中内联识别用户。根据稳定业务事件 ID 和工作流生成 `Idempotency-Key`，重试保持相同收件人与数据。触发端点对相同请求提供默认 24 小时去重，相同键配不同参数会报错。若规格要求跨过这段窗口的去重或恢复业务写入后未送出的通知，Cadence 须持久化待发送事件及其发送结果。请求受端点速率限制，遇到 `429` 时按服务提示退避，并沿用原幂等键。[触发工作流](https://docs.knock.app/send-notifications/triggering-workflows/api) · [API 限制与幂等](https://docs.knock.app/api-reference/overview/api-keys)

## 环境、套餐与保留

- **环境。** 新账号默认只有 production，可启用独立的 development，再按需添加 staging。官方文档注明 2026 年 10 月前开通的账号默认采用 development 和 production。各环境使用独立数据和 API 密钥，部署时从对应环境取 API 密钥、签名密钥和 channel ID。在 development 中提交工作流后可通过 API 验证，之后向下游环境推广。仓库 README 建议使用 Developer 账号，并将本地密钥放入已被忽略的 `.env`。[Cadence README](../../README.md) · [版本控制概览](https://docs.knock.app/version-control/overview) · [环境隔离](https://docs.knock.app/version-control/environments) · [工作流提交](https://docs.knock.app/version-control/commits)
- **套餐。** 官方价格页列出 Developer 每月 0 美元，含 10,000 条消息。Developer 已包含 Feed API、自定义界面、不限默认保留期且可配置的 Feed，以及独立环境。Developer 和 Starter 的日志保留期均为 30 天。Starter 每月 250 美元，含 50,000 条消息，超额部分每条 0.005 美元。计费单位是向一个收件人经一个渠道成功投递的一条消息。课程或团队事件一次发给多人的话，每个成功投递都计入额度。免费额度是套餐用量，官方 FAQ 说明超额后会联系账户方。实际试用时应核对用量面板的统计方式及配置的 Feed 保留期。[Knock 公开定价与 FAQ](https://knock.app/pricing)

## 用真实 Knock 账号验收

1. 用隔离的开发环境配置一个 in-app channel 和一个工作流。使用实际 SDK 版本验证 React Router 生产 SSR 构建、首屏 hydration、刷新后的历史通知与 WebSocket 重连。确认推广后的目标环境使用对应配置和密钥。
2. 用两名隔离测试用户验证各自只能读取和更新自己的通知。验证缺少 token、token 过期、登出、Dev UI 切换用户与 JWT 刷新时的行为，并确认目标页继续执行 Cadence 的权限检查。
3. 测单条与全部已读、未读总数、分页，以及另一标签页和另一设备的状态。记录哪些变化即时到达、哪些在重新读取后可见。验证同一触发请求重试仍只产生一条通知，检查路径字段、投递用量以及最终使用的 Feed 保留配置。

上述验收若发现托管 Feed、持久化已读或账号隔离无法满足 V1，再按具体缺口比较其他托管服务。
