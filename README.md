![通用生图 General Raw Image 2026](https://raw.githubusercontent.com/xiaokangzaina/General-Raw-Image_2026/main/logo.png)

# 通用生图 General Raw Image 2026

AstrBot 通用图像生成插件。一个入口管理多个图像模型供应商，支持文生图、图生图、参考图、LLM 工具调用、供应商轮换和用户用量控制。

当前版本：`v1.2.9`

## 主要能力

- 多供应商配置：OpenAI 兼容接口、Gemini、Grok、SiliconFlow、火山方舟、Gitee AI、即梦等。
- 多模型切换：支持 `供应商名称/模型名称` 选择，也兼容旧的裸模型名称。
- 文生图与图生图：按模型能力自动处理参考图、宽高比和分辨率参数。
- LLM 工具调用：可让 AstrBot 的模型通过工具直接发起生图请求。
- 供应商启用/禁用：禁用后不会参与模型选择和生成请求。
- 用量控制：支持黑名单、冷却时间、每日额度、管理员豁免和白名单会话。
- 独立设置页：提供仪表盘、生成设置、供应商矩阵、权限额度、工具调用和 Raw JSON 视图。

## 安装

1. 打开本仓库的 Release 页面。
2. 下载最新版本的插件压缩包。
3. 在 AstrBot 插件管理页面选择本地安装。
4. 安装后进入插件设置页，填写供应商、模型和 API Key。

Release 页面：

```text
https://github.com/xiaokangzaina/General-Raw-Image_2026/releases
```

## 基础配置

最少需要配置一个图像模型供应商：

| 配置项 | 说明 |
|---|---|
| `api_providers` | 图像模型供应商列表。 |
| `name` | 供应商显示名，也用于 `供应商/模型` 选择。 |
| `api_keys` | API Key 或 Token，默认空，需要自行填写。 |
| `available_models` | 当前供应商可用模型列表。 |
| `enabled` | 是否启用该供应商，未填写时默认为启用。 |
| `generation.model` | 默认模型，可填写 `供应商/模型` 或模型名。 |

推荐使用 `供应商名称/模型名称`，例如：

```text
Ruoli/gpt-image-2
```

如果只填写：

```text
gpt-image-2
```

插件会从启用的供应商中按顺序选择第一个包含该模型的供应商。

## 供应商调用顺序

生图时会先读取当前配置，再从启用的供应商里选择模型：

1. `generation.model` 是 `供应商/模型`：优先匹配这个供应商。
2. `generation.model` 是裸模型名：从启用供应商中按列表顺序查找。
3. 当前选择不可用：回退到第一个启用供应商的第一个可用模型。
4. 已禁用供应商会被跳过，不会参与请求。

设置页里点击供应商的“启用/禁用”会立即保存，并同步运行中的生成器。

## 常见使用

直接发送文字即可触发生图，实际命令以前缀配置和 AstrBot 当前命令注册为准：

```text
画一张赛博朋克风格的猫
```

也可以上传图片后让机器人基于参考图生成。不同供应商支持的参考图、宽高比和分辨率不完全相同，插件会按模型能力自动丢弃不支持的参数。

## 注意事项

- 仓库不包含真实 API Key，安装后需要自行配置。
- 不同供应商的模型名称和能力不同，建议在供应商矩阵中维护实际可用模型。
- 如果修改供应商启用状态后仍走旧供应商，请重载插件或重启 AstrBot，让运行中的 Python 模块加载最新版代码。
- 本地图片路径、代理地址和 API Base URL 请按运行环境填写，不建议提交到公开仓库。

## 开发验证

仓库内保留了两个轻量契约检查，可直接运行：

```powershell
python core/config_manager_contract.test.py
node pages/settings/ui_contract.test.mjs
```

语法检查：

```powershell
python -m py_compile main.py web.py core/config_manager.py core/config_manager_contract.test.py
node --check pages/settings/app.js
```

## 仓库

```text
https://github.com/xiaokangzaina/General-Raw-Image_2026
```
