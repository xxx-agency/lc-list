# lc-list

把一段 LeetCode / 力扣刷题任务文本，自动转换成力扣题单，并批量加入题目。

> English: Create a LeetCode CN problem list from a compact Day-task sentence.

## 它能做什么

你输入类似这样的文本：

```text
Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662
```

`lc-list` 会自动完成：

- 解析 Day、题单名和题号。
- 自动忽略 `O(1)` 这类复杂度里的数字。
- 查询力扣中国站题号对应的 `titleSlug`。
- 生成一个可在已登录 `leetcode.cn` 页面执行的 bookmarklet。
- 创建题单，并把所有题目批量加入题单。

## 环境要求

- Node.js 18+
- Chrome 已登录 `https://leetcode.cn`
- Windows PowerShell（仅自动注入 Chrome 时需要）

核心生成脚本是纯 Node.js，没有 npm 依赖。自动注入功能目前主要适配 Windows，因为它依赖 PowerShell、剪贴板和 Chrome 窗口焦点。

macOS / Linux 用户也可以使用：先生成 `generated/current-bookmarklet.js`，再手动粘贴到 `leetcode.cn` 页面的地址栏执行。

## 快速开始

在 Windows 上生成并自动注入 Chrome：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1 "Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662"
```

只生成，不注入 Chrome：

```powershell
node .\create-list.js "Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662"
```

然后打开任意 `leetcode.cn` 页面，在地址栏输入 `javascript:`，再粘贴 `generated/current-bookmarklet.js` 的内容并回车。

## 参数

```powershell
node .\create-list.js "<任务文本>" --name "二叉树" --private
```

- `--name <name>`：手动指定题单名，覆盖自动解析出的题单名。
- `--private`：创建私有题单。
- `--offline`：只使用本地 `question-cache.json`，不联网查询题目。
- `--text-file <path>`：从文件读取任务文本。

PowerShell 一键脚本也支持这些参数：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1 "<任务文本>" -Name "二叉树" -Private
```

## 生成文件

脚本运行后会写入 `generated/`：

- `current-task.json`
- `current-summary.md`
- `current-bookmarklet.js`

脚本也可能更新 `question-cache.json`，保存公开的题号、题名和 `titleSlug` 映射。

这些文件默认被 `.gitignore` 忽略，因为它们可能暴露你的刷题计划。

## 隐私与安全

`lc-list` 不会要求或保存你的力扣密码。

生成的 bookmarklet 只在你已经登录的 `leetcode.cn` 页面内执行。它会从当前页面读取 CSRF token，并仅向力扣中国站同源接口 `/graphql/` 发送请求。它不会把 cookie、token 或你的题单内容发送到第三方服务。

如果你 fork 或二次发布，建议继续忽略这些文件：

```gitignore
generated/
question-cache.json
node_modules/
.leetcode-browser/
```

## 注意事项

- 本工具依赖力扣中国站当前的 GraphQL 接口。如果力扣更新网页接口，脚本可能需要维护。
- 自动注入依赖 Chrome 窗口焦点。如果焦点失败，bookmarklet 仍会复制到剪贴板，你可以手动粘贴执行。
- 解析器会刻意去掉 `O(1)` 这类复杂度文本，避免把复杂度数字误认为题号。

## License

MIT
