# 通用生图 General Raw Image 2026

面向 AstrBot 的通用图像生成插件。  
这是用于个人维护的自定义版本，仓库地址：

```text
https://github.com/xiaokangzaina/General-Raw-Image_2026
```

## 功能概览

- 支持多种图像生成供应商。
- 支持 `/生图 <提示词>` 指令生成图片。
- 支持文生图和图生图。
- 支持 LLM 工具调用生图。
- 支持消息图片、引用消息图片、@ 用户头像作为参考图。
- 支持频率限制、每日额度、会话黑名单。
- 使用限制白名单支持直接填写完整 UMO、QQ号或群号。
- 生图完成后可选择是否引用原消息回复。
- 开始生图任务时可发送文字提示，也可附带固定图片。

## 安装方式

### 方式一：Release 压缩包安装

1. 打开 Release 页面：

```text
https://github.com/xiaokangzaina/General-Raw-Image_2026/releases
```

2. 下载最新版本的 ZIP 附件，例如：

```text
astrbot_plugin_general_raw_image_2026-v1.2.4.zip
```

3. 打开 AstrBot 插件管理。
4. 选择本地插件/压缩包安装。
5. 选择下载的 ZIP 文件。
6. 安装后重载插件或重启 AstrBot。

### 方式二：仓库安装

如果 AstrBot 支持从 GitHub 仓库安装，可填写：

```text
https://github.com/xiaokangzaina/General-Raw-Image_2026
```

## 命令

| 命令 | 说明 |
| :--- | :--- |
| `/生图 <提示词>` | 根据提示词生成图片。 |
| `/生图模型` | 查看可用模型和当前模型。 |
| `/生图模型 <序号>` | 切换到指定序号的模型。 |

示例：

```text
/生图 一只赛博朋克风格的猫
```

```text
/生图模型
/生图模型 2
```

## 主要配置

### LLM 工具

| 配置项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| 启用 LLM 工具 | 生图工具 | 是否允许 LLM 自动调用生图工具。 |

本版本只保留生图工具，已移除预设查询和预设编辑工具。

### 生成设置

| 配置项 | 说明 |
| :--- | :--- |
| 生图模型 | 当前使用的生图模型。 |
| 默认宽高比 | 默认图片比例。 |
| 默认分辨率 | 默认图片质量/分辨率。 |
| 最大并发任务数 | 同时执行的生图任务数量。 |
| 显示生图信息 | 成功后显示耗时、图片数量等信息。 |
| 显示模型信息 | 成功后显示使用的模型。 |
| 生图完成后引用原消息 | 开启后，生成完成发送图片时引用触发 `/生图` 或 LLM 工具调用的原消息。 |
| 生图完成回复文本 | 生图完成并发送结果时，在引用原消息下方附加的文字；留空则不发送任何文字，只引用原消息并发送图片。 |
| 开始任务时发送固定图片 | 开启后，开始生图任务时附带一张固定图片。 |
| 开始任务固定图片路径 | 本地图片绝对路径或 http(s) 图片 URL。列表为空时使用该单路径。 |
| 开始任务固定图片路径列表 | 可填写多个本地图片绝对路径或 http(s) 图片 URL；填写后优先使用列表。 |
| 开始任务固定图片选择模式 | 支持“顺序轮询”和“随机”。仅在路径列表不为空时生效。 |
| 开始生图任务提示模板 | 任务开始时发送的文字提示；留空则不发送文字。 |

### 开始任务固定图片多路径轮询

单路径兼容配置：

```json
"start_task_image_path": "D:\\vsmdata\\002\\1\\loading.jpg"
```

多路径配置：

```json
{
  "enable_start_task_image": true,
  "start_task_image_paths": [
    "D:\\vsmdata\\002\\1\\1.jpg",
    "D:\\vsmdata\\002\\1\\2.gif",
    "https://example.com/3.png"
  ],
  "start_task_image_select_mode": "顺序轮询"
}
```

选择模式：

```text
顺序轮询：第一次发送第 1 张，第二次第 2 张，依次循环。
随机：每次从列表中随机选择一张。
```

如果 `start_task_image_paths` 为空，则继续使用旧的 `start_task_image_path`。

### 开始任务提示文字 + 图片

可以同时配置文字和图片。

示例：

```json
{
  "start_task_message_template": "正在创作淫秽作品",
  "enable_start_task_image": true,
  "start_task_image_path": "D:\\vsmdata\\002\\1\\55733F7E2F1A61377552FDE0814147D4.jpg"
}
```

效果：

```text
用户发送 /生图 xxx
机器人先发送：正在创作淫秽作品 + 固定图片
生成完成后发送生成结果图片
```

如果只想发送固定图片，不想发送文字：

```json
{
  "start_task_message_template": "",
  "enable_start_task_image": true
}
```

如果不想发送开始提示图片：

```json
{
  "enable_start_task_image": false
}
```

### 生图完成后引用原消息和回复文本

是否引用原消息：

```json
"reply_to_source_message": true
```

生图完成后附加文字：

```json
"completion_reply_text": "创作完成"
```

开启引用且配置回复文本后：

```text
用户：/生图 xxx
机器人：引用用户原消息 + 创作完成 + 生成图片
```

如果回复文本留空：

```json
"completion_reply_text": ""
```

效果：

```text
机器人：引用用户原消息 + 生成图片
```

如果关闭引用：

```json
"reply_to_source_message": false
```

效果：

```text
机器人直接发送生成图片
```

### 使用限制

| 配置项 | 说明 |
| :--- | :--- |
| 启用使用限制 | 总开关。开启后，不在使用限制白名单里的 QQ群或 QQ 用户会受到黑名单、频率限制和每日额度限制；关闭后所有会话直接放行。 |
| 会话黑名单 | 黑名单命中的会话不能使用生图。支持完整 UMO、QQ号或群号匹配。 |
| 管理员无视使用限制 | AstrBot 管理员跳过黑名单、频率限制和每日额度。 |
| 使用限制白名单 | 可填写完整 UMO、QQ号或群号；命中后跳过黑名单、频率限制和每日额度。 |
| 黑名单拒绝提示 | 黑名单命中时返回的文本。 |
| 速率限制 | 单个会话两次请求之间的最小间隔。 |
| 启用每日额度 | 开启后按会话统计每日生图次数。 |
| 每日允许生成数量 | 每个会话每天最多生成数量。 |
| 最大参考图大小 | 限制用户上传或引用参考图的大小。 |


### 使用限制总开关

配置项：

```json
"enable_usage_limits": true
```

开启后：

```text
不在使用限制白名单里的 QQ群或 QQ 用户，会受到会话黑名单、频率限制和每日额度限制。
在使用限制白名单里的 QQ群或 QQ 用户，会跳过这些限制。
```

关闭后：

```json
"enable_usage_limits": false
```

效果：

```text
所有会话直接放行，不检查黑名单、频率限制和每日额度。
```

## 使用限制白名单填写方式

配置字段名：

```json
"umo_whitelist"
```

界面显示名称：

```text
使用限制白名单
```

支持三种写法：

```text
完整 unified_msg_origin（UMO）
QQ群号
QQ号
```

示例：

```json
"umo_whitelist": [
  "aiocqhttp:GroupMessage:123456789_987654321",
  "123456789",
  "987654321"
]
```

说明：

- 填完整 UMO：只匹配该具体会话。
- 填群号：匹配该群相关会话。
- 填 QQ号：匹配该用户相关会话。

## 本版本已移除功能

以下功能已从配置模板和运行逻辑中移除：

- 安全审核
- 图片审核
- 审核白名单
- 提示词模板
- 预设提示词
- 人设模板
- `/预设` 指令
- 预设/人设相关 LLM 工具

## 目录结构

```text
adapter/              图像供应商适配器
core/                 核心逻辑
main.py               插件入口
metadata.yaml         AstrBot 插件元数据
_conf_schema.json     AstrBot 配置模板
requirements.txt      依赖说明
README.md             文档
LICENSE               许可证
```

## 插件标识与更新来源

本插件元数据已改为独立标识，避免被 AstrBot 识别成原始上游插件：

```yaml
name: astrbot_plugin_general_raw_image_2026
repo: https://github.com/xiaokangzaina/General-Raw-Image_2026
```

如果你之前安装过 `astrbot_plugin_image_generation`，建议先卸载旧插件，再安装本仓库 Release ZIP。这样 AstrBot 后续更新来源会指向本仓库，而不会按原插件提示更新。

## 重载插件

修改配置后，请执行以下任一操作：

```text
重载插件
```

或：

```text
重启 AstrBot
```

## 许可证

见 `LICENSE`。
