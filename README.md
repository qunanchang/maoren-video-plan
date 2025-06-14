# 千川视频名称生成器 - 飞书多维表格字段捷径插件

## 功能介绍

这是一个基于飞书多维表格字段捷径的视频名称生成器插件，可以根据输入的账号信息、框架、日期、脚本名称等信息自动生成规范化的视频名称。

### 主要功能

- **账号名称**：输入所属账号名称（必填）
- **主打框架**：可选择多个框架标签（信任、价格、品质、情感、专业、创意）
- **发布日期**：选择预定发布日期（必填，自动格式化为YYYYMMDD）
- **脚本名称**：输入脚本描述（必填）
- **剪辑负责人**：输入剪辑人员姓名（可选）

### 生成规则

生成的视频名称格式为：`账号名称-框架-日期-脚本名称-剪辑人`

示例：`男主播A-信任,价格-20241201-Polo衫面料深度解析-张三`

## 开发环境设置

### 前置要求

- Node.js 版本 >= 14.16.0
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
```

### 本地开发

1. 启动本地开发服务器：

```bash
npm run start
```

2. 在飞书多维表格中使用「字段捷径调试助手」进行调试

### 构建和打包

```bash
npm run pack
```

打包后的文件位于 `output/output.zip`，可以直接上传到飞书多维表格。

## 项目结构

```
├── src/
│   └── index.ts          # 主要插件代码
├── config.json           # 本地调试配置
├── package.json          # 项目依赖配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目说明
```

## 使用说明

### 在飞书多维表格中使用

1. 在多维表格中创建新的字段捷径
2. 选择「FaaS版」类型
3. 上传打包后的 `output.zip` 文件
4. 配置表单参数：
   - 账号名称：文本输入
   - 主打框架：多选下拉
   - 发布日期：日期字段选择
   - 脚本名称：文本输入
   - 剪辑负责人：文本输入（可选）

### 输入验证

- 账号名称：至少2个字符
- 发布日期：不能早于当前日期
- 脚本名称：至少3个字符
- 剪辑负责人：可选，最多20个字符

## 技术实现

### 核心功能

- 使用 `@lark-opdev/block-basekit-server-api` 开发框架
- TypeScript 类型安全
- 完整的输入验证
- 错误处理和用户友好的错误信息

### 表单组件

- `Input`：文本输入组件
- `MultipleSelect`：多选下拉组件
- `FieldSelect`：字段选择组件（用于日期字段）

### 数据处理

- 日期格式化：将时间戳转换为 YYYYMMDD 格式
- 框架处理：支持多选框架，用逗号分隔
- 字符串拼接：按照规定格式组合各部分

## 调试指南

### 本地调试

1. 确保本地服务已启动（`npm run start`）
2. 使用飞书多维表格的「字段捷径调试助手」
3. 在调试模板中测试各种输入组合

### 常见问题

1. **日期格式问题**：确保选择的是日期字段，插件会自动处理时间戳格式
2. **框架选择**：支持多选，会自动用逗号连接
3. **输入验证**：注意必填字段和字符长度限制

## 部署上线

1. 运行 `npm run pack` 打包
2. 将 `output/output.zip` 上传到飞书多维表格
3. 提交到 Github 仓库
4. 填写[多维表格捷径插件表单](https://feishu.feishu.cn/share/base/form/shrcnwTXnFVAbMPOSeaOFwIAnbf)

## 版本历史

- v1.0.0：初始版本，支持基本的视频名称生成功能

## 许可证

MIT License