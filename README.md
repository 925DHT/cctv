# OpenClash Subscription via Cloudflare Workers

本项目实现：自动抓取优选 IP，生成 Clash 订阅，自动部署到 Cloudflare Workers，并定期刷新节点。

---

## 1. Fork 或 Clone 本仓库

你可以直接 Fork 本项目，或将文件 clone 到自己的仓库。

## 2. 配置 Cloudflare Workers

### 2.1 注册 Cloudflare 账号

- 访问 [Cloudflare 官网](https://dash.cloudflare.com/) 注册账号。
- 完成邮箱验证和基本设置。

### 2.2 创建 Workers 项目

- 登录后，左侧菜单选择“Workers & Pages” -> “Create application” -> “Create Worker”。
- 随便起个名字，比如 `openclash-subscription`。
- 进入 Workers 仪表台，点击你刚创建的 Worker，找到“KV Namespaces”，新建一个命名空间，如 `OPENCLASH_KV`。

### 2.3 获取 KV 命名空间 ID

- 在“KV Namespaces”页面，点击刚创建的命名空间，复制它的 `ID`。

### 2.4 配置 wrangler.toml

- 打开你仓库的 `wrangler.toml` 文件，将 `your-kv-namespace-id` 替换为上面复制的 KV 命名空间 ID。

  ```toml
  [[kv_namespaces]]
  binding = "OPENCLASH_KV"
  id = "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx"
  ```

### 2.5 创建 Cloudflare API Token

- 进入 Cloudflare “My Profile” -> “API Tokens” -> “Create Token”。
- 选择 “Edit Cloudflare Workers” 模板，赋予你所用账户下的 Workers 相关权限（包括 Workers 和 KV）。
- 生成后复制 API Token。

### 2.6 配置 GitHub Secrets

- 打开你仓库页面，进入 `Settings` → `Secrets and variables` → `Actions`。
- 新增名为 `CF_API_TOKEN` 的 secret，值为上面复制的 Cloudflare API Token。

---

## 3. 自动部署设置

### 3.1 配置 GitHub Actions

- `.github/workflows/deploy.yml` 已写好，无需修改。
- 它会在：
  - 每 4 小时自动运行（定时任务，刷新 IP 并重新部署 Workers）
  - 每次推送到 main 分支时自动部署

### 3.2 手动触发部署

- 你也可以手动在 GitHub Actions 页面选择 `Deploy to Cloudflare Workers` workflow，点击“Run workflow”进行部署。

---

## 4. 使用订阅链接

### 4.1 获取订阅地址

- 部署成功后，访问你的 Workers 地址（以 `https://xxx.xxx.workers.dev` 为例）：

  ```
  https://xxx.xxx.workers.dev/sub
  ```

- 或者
  ```
  https://xxx.xxx.workers.dev/clash
  ```

- 你可以将此链接添加到 Clash、OpenClash、Clash for Android 等软件作为远程订阅。

### 4.2 支持的功能

- 自动抓取 [ethgan/yxip](https://github.com/ethgan/yxip/blob/main/ip.txt) 的前 20 个优选 IP 作为节点
- 自动生成支持流媒体解锁的 Clash 节点配置
- 每 4 小时自动刷新优选 IP，无需手动干预

---

## 5. 常见问题与说明

### 5.1 如何确认部署成功？

- 访问 `https://xxx.xxx.workers.dev/ping`，若返回 `ok`，说明 Workers 正常运行。
- 访问订阅链接会返回 Clash 配置（YAML 格式）。

### 5.2 如何定制节点数量、端口等？

- 编辑 `src/worker.js` 文件中的 `NODE_COUNT`、`port`、`cipher`、`password` 等参数，可以自定义节点数量和加密方式等。

### 5.3 特别说明

- 本项目仅用于学习和交流，请勿用于任何非法用途。
- 优选 IP 列表来源于 [ethgan/yxip](https://github.com/ethgan/yxip)，如有更换请相应修改源码。
- 若需 QuantumultX/SingBox 等其他格式，自行扩展 `worker.js` 逻辑即可。

---

## 6. 参考资料

- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/)
- [Wrangler 官方文档](https://developers.cloudflare.com/workers/wrangler/)
- [Clash 官方文档](https://github.com/Dreamacro/clash/blob/master/docs/config.yaml)

---

## 7. 高级：自定义计划任务（可选）

如果你想自定义刷新频率，请编辑 `wrangler.toml` 的 cron 表达式：

```toml
[triggers]
crons = ["0 */4 * * *"] # 每4小时
```
详见 [cron 语法](https://developers.cloudflare.com/workers/platform/cron-triggers/)

---

如有其它问题可在 Issues 区留言或联系维护者。
