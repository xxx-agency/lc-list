# Security Notes

This tool is designed to avoid storing authentication secrets.

- It does not collect LeetCode passwords.
- It does not save `LEETCODE_SESSION` cookies.
- It does not send cookies or CSRF tokens to third-party servers.
- The generated bookmarklet runs on `leetcode.cn` and uses the page's existing logged-in session to call LeetCode CN GraphQL endpoints.

Files under `generated/` and `question-cache.json` can reveal what topics or problems you are studying. They are ignored by Git by default.

If you modify the bookmarklet logic, keep all network requests same-origin unless you intentionally document otherwise.
