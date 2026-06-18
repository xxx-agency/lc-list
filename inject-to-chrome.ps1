param(
  [string]$BookmarkletPath = "",
  [string]$OpenUrl = "https://leetcode.cn/problemset/"
)

if (-not $BookmarkletPath) {
  $BookmarkletPath = Join-Path $PSScriptRoot "generated\current-bookmarklet.js"
}

if (-not (Test-Path $BookmarkletPath)) {
  throw "Bookmarklet not found: $BookmarkletPath"
}

$js = Get-Content -Raw -Encoding UTF8 $BookmarkletPath
Set-Clipboard -Value $js

Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

Start-Process "chrome.exe" $OpenUrl
Start-Sleep -Seconds 3

$chrome = Get-Process chrome -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  Sort-Object StartTime -Descending |
  Select-Object -First 1

if (-not $chrome) {
  throw "No open Chrome window found."
}

[Microsoft.VisualBasic.Interaction]::AppActivate([int]$chrome.Id) | Out-Null
Start-Sleep -Milliseconds 700
[System.Windows.Forms.SendKeys]::SendWait("%d")
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("javascript:")
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("^v")
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "Injected bookmarklet into Chrome. If Chrome blocked focus, the JavaScript is still on your clipboard."
