# t3code 本地隐私版

基于 [pingdotgg/t3code](https://github.com/pingdotgg/t3code) 的非官方 fork。

## 本 fork 的改动

- **关闭产品遥测。** 移除向 `ingest.t3.codes` 发送使用事件的逻辑，移除用于遥测的 Codex 和 Claude 登录文件读取，以及跨设备账号和设备标识上报。
- **关闭内置诊断上报。** 禁用 Axiom 中继追踪、移动端崩溃上报、Agent 反馈和通过 T3 Connect 发布线程活动。
- **限制为本机访问。** 服务端只允许回环连接，关闭 T3 Connect、局域网和 Tailscale 接入、预览隧道及远程 Webhook。
- **关闭内置更新。** 禁用应用自更新和 Expo OTA 更新，防止上游构建覆盖这些改动。

[隐私与诊断说明](./docs/user/telemetry.md)
