# paseo-agent-team

[English](./README.md) | 简体中文

给任意 coding agent 提供 OpenSpec 工程工作流，并通过可选的 Paseo 插件按需组织 agent 团队。默认独立工作，需要协作时再启动成员。

| 使用方式 | 安装内容 | 提供的能力 |
|----------|----------|------------|
| 独立工程工作流 | 在项目中运行 `init.sh` | OpenSpec、ADR 规则、通用技能、纪律钩子；不依赖 Paseo |
| Paseo 增强工作流 | 在 Paseo 主机安装 Agent Team 插件 | 项目面板、profile 选择、成员任务、结果查看、追问和归档 |

## 安装独立工程工作流

先在本机准备 Git 和 OpenSpec CLI：

```bash
npm install -g @fission-ai/openspec@latest
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh
```

默认安装 `openspec,adr,skills,hooks`。`--with adr,skills` 可以只安装指定组件；`--language "Simplified Chinese"` 设置产物语言；`--tools` 指定 OpenSpec 工具集成。任何成功的组件选择都会安装托管的 `AGENTS.md` 工程规则。

缺少 OpenSpec 时，安装器会跳过该组件并给出恢复指引。默认安装不会复制插件、创建运行目录或启动 agent。

启动 coding agent 后，用自然语言描述需求即可。大变更遵循 proposal → specs → design → ADR → tasks → 实现 → 归档，小改动直接实施。

## 安装 Paseo Agent Team 插件

每台 Paseo daemon 安装一次，可在多个项目中使用：

```bash
cd /path/to/paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

先在目标主机的 **Settings → Plugins** 开启插件。插件会以受信任代码运行在该主机上。本插件支持 Paseo 0.8.x，daemon 和连接的客户端都需兼容。

在项目工作区通过 Command Center 打开 **Agent Team**，或者输入 `/agent-team`。打开面板不会启动成员。

1. 查看当前 OpenSpec 变更与任务进度。
2. 选择 Researcher（外部调研）、Writer（仅 `docs/`）或 Worker（简单杂务）。
3. 选择已有 Paseo profile，阅读其用途说明；没有可用 profile 时会发现可用模型。
4. 写清背景、具体要求、期望输出和验收标准，再启动一个成员。Worker 必须使用独立 worktree；Researcher 和 Writer 默认在当前工作区内遵守各自范围。
5. 打开成员会话，或刷新面板收集状态与结果；需要时继续追问。
6. 审查并整合结果后归档成员。插件保留 worktree，由你决定如何合入代码。

现有主 agent 继续担任 Tech Lead，负责架构、核心代码、OpenSpec/ADR 和最终审查。Researcher 和 Writer 用于隔离大量调研和文档上下文；Worker 谨慎使用，代码由主 agent 逐行审查。面板显示各角色的模型偏好供参考，实际配置仍需明确选择。详见[成员职责与配置偏好](./docs/team-roles.md)。

每次明确启动一个成员，多次启动即可组成需要的团队。成员通过插件记录和标签分组，不会自动指定某个已有会话为父 agent。角色范围是提示词约束，实际权限遵循你选择的 provider/profile。

## 项目文件

```text
init.sh                         独立工作流安装器
AGENTS.md                       工程规则与显式协作约定
openspec/                       当前规格、变更历史、schema
adr/                            不可修改的架构决策历史
docs/                           安装、工作流、插件与架构说明
scripts/                        纪律钩子和安装回归测试
plugins/paseo-agent-team/        Paseo 插件源码
  paseo-plugin.json             插件 ID 与版本要求
  index.client.tsx              面板和命令入口
  index.server.ts               团队操作入口
  client/                       原生界面
  server/                       生命周期、SDK 调用和状态持久化
  shared/                       类型协议与角色定义
```

启动成员时，插件才在原项目中创建 `.paseo-agent-team/` 并加入 `.gitignore`，存储任务、agent 关联和已收集结果。OpenSpec 和 ADR 仍是项目能力与架构决策的持久事实来源。

## 升级和检查

重跑 `init.sh` 升级指定组件。旧 `copilot-workflow` 标记块和钩子会迁移，保留标记块外的用户内容。新清单为 `.paseo-agent-team.yaml`，旧环境变量保留为迁移别名。详见[安装与迁移指南](./docs/getting-started.md)。

```bash
bash scripts/regression-test.sh
npm --prefix plugins/paseo-agent-team run typecheck
npm --prefix plugins/paseo-agent-team test
openspec validate --all --strict
```

插件修改后先检查，再运行 `paseo plugin reload paseo-agent-team`。本地代码改名不会自动修改远程仓库名称或发布代码；远程仓库发布前使用上面的本地安装方式。

[文档目录](./docs/README.md) · [Paseo 操作指南](./docs/paseo-guide.md) · [架构说明](./docs/architecture.md)
