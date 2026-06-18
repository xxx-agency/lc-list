param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$TaskText,
  [string]$Name = "",
  [string]$NodePath = "node",
  [switch]$Private,
  [switch]$Offline
)

$root = $PSScriptRoot
$node = $NodePath
$script = Join-Path $root "create-list.js"
$injectScript = Join-Path $root "inject-to-chrome.ps1"

$nodeArgs = @($script, $TaskText)
if ($Name) {
  $nodeArgs += @("--name", $Name)
}
if ($Private) {
  $nodeArgs += "--private"
}
if ($Offline) {
  $nodeArgs += "--offline"
}

& $node @nodeArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& "$PSHOME\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $injectScript
