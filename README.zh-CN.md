# paseo-agent-team

[English](./README.md) | 简体中文

为任意 coding agent 提供 OpenSpec 工程工作流，并通过可选的原生 Paseo 插件按需组织团队。默认独立工作，需要协作时明确启动成员。

| 使用方式 | 安装方法 | 提供的能力 |
|----------|----------|------------|
| 独立工程工作流 | 在项目中运行 `init.sh` | OpenSpec、ADR 规则、通用技能和纪律钩子 |
| Paseo 增强工作流 | 在 Paseo 主机安装 Agent Team | 工作区面板、profile 选择、成员任务、结果查看、追问和归档 |

## 安装工程工作流

需要 Git、Bash 和 OpenSpec CLI。在目标 Git 项目中运行：

```bash
npm install -g @fission-ai/openspec@latest
curl -fsSL https://raw.githubusercontent.com/lixw1994/paseo-agent-team/main/init.sh | bash
```

默认组件为 `openspec,adr,skills,hooks`。安装会创建托管的项目规则和工作流文件，不会安装 Paseo 或启动团队。缺少 OpenSpec 时会跳过该组件，并给出补装命令。

使用本地源码或自定义参数：

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd /path/to/your-project
/path/to/paseo-agent-team/init.sh --with openspec,adr,skills,hooks
```

`--with` 替换默认组件列表。`--language "Simplified Chinese"` 设置新建 OpenSpec 配置的语言；已有项目保留原有 context。默认工具集成为 `--tools agents`。

向 coding agent 描述需求即可开始。大变更遵循 proposal → specs → design → ADR → tasks → 实现 → 验证 → 归档；小修复和文档调整可以直接实施。

## 安装 Paseo Agent Team

插件支持 Paseo 0.8.x，本地安装需要 Node.js 和 npm。先在目标 daemon 的 **Settings → Plugins** 开启受信任插件，再从源码安装：

```bash
git clone https://github.com/lixw1994/paseo-agent-team.git
cd paseo-agent-team/plugins/paseo-agent-team
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
paseo plugin ls
```

插件应显示 `running`。每台 daemon 安装一次，可供多个工作区使用。在目标工作区的 Command Center 选择 **Open Agent Team**，或提交 `/agent-team`。

1. 选择 Researcher（外部调研）、Writer（仅 `docs/`）或 Worker（简单杂务）。
2. 选择已配置的 Paseo profile 或可用模型。
3. 填写背景、具体要求、期望输出和验收标准，点击 **Start selected member**。
4. 打开成员会话，或刷新面板查看状态与输出；需要时继续追问。
5. 审查并整合结果后归档成员，worktree 会保留。

现有主 agent 担任 Tech Lead，负责架构、核心代码、OpenSpec/ADR 和最终审查。Worker 必须使用独立 worktree；Researcher 和 Writer 可在当前工作区内遵守各自范围。角色提示词不能替代 provider 的权限设置。

打开面板不会启动成员。每次明确启动一个成员；插件不会自动启动固定团队，也不会自动将成员挂到已有主会话下。

## 项目结构

```text
init.sh                         独立工作流安装器
AGENTS.md                       工程与协作规则
openspec/                       能力规格、变更和 schema
adr/                            架构决策
plugins/paseo-agent-team/        原生 Paseo 插件
  client/                       适配主题的工作区面板
  server/                       成员操作、SDK 适配和本地状态
  shared/                       协议与角色定义
scripts/                        纪律钩子和安装回归测试
docs/                           安装、工作流、角色和架构说明
```

启动成员时，插件在原项目中创建被 Git 忽略的 `.paseo-agent-team/` 状态目录。OpenSpec 和 ADR 仍是项目能力与架构的事实来源。

## 文档与贡献

[安装指南](./docs/getting-started.md) · [Paseo 使用指南](./docs/paseo-guide.md) · [成员职责](./docs/team-roles.md) · [架构说明](./docs/architecture.md)

开发环境和验证命令见 [CONTRIBUTING.md](./CONTRIBUTING.md)。行为变更必须同步更新相关指南和中英文 README。

## 许可证

[MIT](./LICENSE)。随仓库分发的 schema 保留各自的许可证声明。
