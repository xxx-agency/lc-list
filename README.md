# lc-list

Create a LeetCode CN problem list from a compact Day-task sentence.

Example input:

```text
Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662
```

`lc-list` parses the list name and problem IDs, resolves problem IDs to LeetCode CN `titleSlug`s, creates a bookmarklet, and can inject it into an already logged-in Chrome session to create the list and batch-add questions.

## Requirements

- Node.js 18+
- Windows PowerShell if you want automatic Chrome injection
- Chrome logged in to `https://leetcode.cn`

The generator itself is plain Node.js and has no npm dependencies. Automatic injection is Windows-only because it uses PowerShell, the clipboard, and Chrome window focus. On macOS/Linux, generate the bookmarklet and paste it manually into a `leetcode.cn` address bar.

## Quick Start

Generate and inject on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1 "Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662"
```

Generate only:

```powershell
node .\create-list.js "Day 24二叉树100 相同树、101 对称树、102 层序遍历、104 最大深度、226 翻转树、543 直径、98 验证 BST、236 LCA、105、106、110、112、114、124、199、230、297、437、662"
```

Then open any `leetcode.cn` page, type `javascript:` in the address bar, paste `generated/current-bookmarklet.js`, and press Enter.

## Options

```powershell
node .\create-list.js "<task text>" --name "二叉树" --private
```

- `--name <name>` overrides the parsed list name.
- `--private` creates a private LeetCode list.
- `--offline` only uses `question-cache.json` and skips network lookup.
- `--text-file <path>` reads the task text from a file.

PowerShell wrapper options:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1 "<task text>" -Name "二叉树" -Private
```

## Generated Files

The tool writes runtime artifacts to `generated/`:

- `current-task.json`
- `current-summary.md`
- `current-bookmarklet.js`

It may also update `question-cache.json` with public LeetCode problem metadata. These files are ignored by Git by default because they can reveal your study plan.

## Privacy and Safety

`lc-list` does not ask for or store your LeetCode password.

The generated bookmarklet runs inside your already logged-in `leetcode.cn` page. It reads the page's CSRF token from `document.cookie` and sends GraphQL requests only to LeetCode CN using `credentials: "include"`. It does not send cookies, tokens, or problem lists to any third-party service.

Before publishing your fork, keep these ignored:

```gitignore
generated/
question-cache.json
node_modules/
.leetcode-browser/
```

## Caveats

- This relies on LeetCode CN's current GraphQL operations. If LeetCode changes the website API, the script may need updates.
- Automatic injection depends on Chrome window focus. If focus fails, the bookmarklet is still copied to your clipboard for manual paste.
- The parser intentionally strips `O(1)`-style complexity text so it does not mistake complexity numbers for problem IDs.

## License

MIT
