param(
    [switch]$Execute,
    [switch]$GeneralSafe,
    [switch]$IncludeNvidiaDxCache,
    [switch]$IncludeRecycleBin,
    [switch]$IncludeWindowsTemp,
    [switch]$IncludeCrashDumps,
    [switch]$IncludeBrowserCaches,
    [switch]$IncludeSteamCache,
    [switch]$IncludeWpsBackups,
    [switch]$IncludeGameCaches,
    [switch]$IncludeDockerPrune,
    [switch]$IncludeJetBrainsIndexes,
    [int]$TempOlderThanDays = 7,
    [string]$UserProfilePath = $env:USERPROFILE
)

$ErrorActionPreference = "SilentlyContinue"

function ConvertTo-Gb {
    param([Nullable[double]]$Bytes)
    if ($null -eq $Bytes) { return 0 }
    return [math]::Round($Bytes / 1GB, 2)
}

function Get-PathSizeBytes {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return 0 }
    $item = Get-Item -LiteralPath $Path -Force
    if (-not $item.PSIsContainer) { return $item.Length }
    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -Force -File |
        Measure-Object -Property Length -Sum).Sum
    if ($null -eq $sum) { return 0 }
    return $sum
}

function Resolve-ExistingPath {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    return (Resolve-Path -LiteralPath $Path).Path
}

function Assert-AllowedCleanupPath {
    param([string]$Path)

    $resolved = Resolve-ExistingPath $Path
    if ($null -eq $resolved) { return $false }

    $allowedRoots = @(
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Temp")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\pip\Cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\npm-cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Roaming\Code")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Code Cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Code Cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\GPUCache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Service Worker\CacheStorage")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\extensions_crx_cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\component_crx_cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\GPUCache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Service Worker\CacheStorage")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\Steam\htmlcache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\CrashDumps")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\NVIDIA\DXCache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Local\JetBrains")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\backup")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\cache")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\log")),
        (Resolve-ExistingPath "C:\Windows\Temp"),
        (Resolve-ExistingPath "C:\ProgramData\Naughty Dog\Uncharted4"),
        (Resolve-ExistingPath (Join-Path $UserProfilePath ".codex\.tmp")),
        (Resolve-ExistingPath (Join-Path $UserProfilePath ".codex\tmp"))
    ) | Where-Object { $_ }

    foreach ($root in $allowedRoots) {
        if ($resolved -eq $root -or $resolved.StartsWith($root + [IO.Path]::DirectorySeparatorChar)) {
            return $true
        }
    }
    return $false
}

function Remove-Contents {
    param(
        [string]$Path,
        [string]$Name,
        [int]$OlderThanDays = -1
    )

    if (-not (Test-Path -LiteralPath $Path)) { return }

    $before = Get-PathSizeBytes $Path
    if ($before -le 0) { return }

    $items = Get-ChildItem -LiteralPath $Path -Force
    if ($OlderThanDays -ge 0) {
        $cutoff = (Get-Date).AddDays(-$OlderThanDays)
        $items = $items | Where-Object { $_.LastWriteTime -lt $cutoff }
    }

    $candidateBytes = 0
    foreach ($item in $items) {
        $candidateBytes += Get-PathSizeBytes $item.FullName
    }

    if ($candidateBytes -le 0) { return }

    $script:Results += [pscustomobject]@{
        Action = if ($Execute) { "Cleaned" } else { "Would clean" }
        Name = $Name
        GB = ConvertTo-Gb $candidateBytes
        Path = $Path
    }

    if (-not $Execute) { return }

    foreach ($item in $items) {
        if (Assert-AllowedCleanupPath $item.FullName) {
            Remove-Item -LiteralPath $item.FullName -Recurse -Force
        }
    }
}

function Run-CommandCleanup {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments,
        [string]$MeasuredPath
    )

    $before = Get-PathSizeBytes $MeasuredPath
    if ($before -le 0) { return }

    $script:Results += [pscustomobject]@{
        Action = if ($Execute) { "Command" } else { "Would run" }
        Name = $Name
        GB = ConvertTo-Gb $before
        Path = $MeasuredPath
    }

    if ($Execute -and (Get-Command $Command -ErrorAction SilentlyContinue)) {
        & $Command @Arguments | Out-Null
    }
}

$script:Results = @()

$paths = @{
    Temp = Join-Path $UserProfilePath "AppData\Local\Temp"
    PipCache = Join-Path $UserProfilePath "AppData\Local\pip\Cache"
    NpmCache = Join-Path $UserProfilePath "AppData\Local\npm-cache"
    VsCodeCachedVsix = Join-Path $UserProfilePath "AppData\Roaming\Code\CachedExtensionVSIXs"
    VsCodeCachedData = Join-Path $UserProfilePath "AppData\Roaming\Code\CachedData"
    VsCodeCache = Join-Path $UserProfilePath "AppData\Roaming\Code\Cache"
    ChromeCodeCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Code Cache"
    EdgeCodeCache = Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Code Cache"
    CodexTmpA = Join-Path $UserProfilePath ".codex\.tmp"
    CodexTmpB = Join-Path $UserProfilePath ".codex\tmp"
    NvidiaDxCache = Join-Path $UserProfilePath "AppData\Local\NVIDIA\DXCache"
    WindowsTemp = "C:\Windows\Temp"
    CrashDumps = Join-Path $UserProfilePath "AppData\Local\CrashDumps"
    SteamHtmlCache = Join-Path $UserProfilePath "AppData\Local\Steam\htmlcache"
    ChromeCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Cache"
    ChromeGpuCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\GPUCache"
    ChromeServiceWorkerCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\Default\Service Worker\CacheStorage"
    ChromeExtensionsCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\extensions_crx_cache"
    ChromeComponentsCache = Join-Path $UserProfilePath "AppData\Local\Google\Chrome\User Data\component_crx_cache"
    EdgeCache = Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Cache"
    EdgeGpuCache = Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\GPUCache"
    EdgeServiceWorkerCache = Join-Path $UserProfilePath "AppData\Local\Microsoft\Edge\User Data\Default\Service Worker\CacheStorage"
    WpsBackup = Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\backup"
    WpsCache = Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\cache"
    WpsLog = Join-Path $UserProfilePath "AppData\Roaming\kingsoft\office6\log"
    NaughtyDogUncharted4 = "C:\ProgramData\Naughty Dog\Uncharted4"
    RecycleBin = "C:\`$Recycle.Bin"
}

Write-Host ""
Write-Host "C drive developer-cache cleanup"
Write-Host "Mode: $(if ($Execute) { 'EXECUTE' } else { 'DRY RUN' })"
Write-Host "Tip: close Codex, Docker Desktop, PyCharm, VS Code, browsers, and GPU/AI apps before running with -Execute."
Write-Host ""

Remove-Contents -Path $paths.Temp -Name "User temp files older than $TempOlderThanDays days" -OlderThanDays $TempOlderThanDays
Run-CommandCleanup -Name "pip cache" -Command "python" -Arguments @("-m", "pip", "cache", "purge") -MeasuredPath $paths.PipCache
Remove-Contents -Path $paths.NpmCache -Name "npm cache"
Remove-Contents -Path $paths.VsCodeCachedVsix -Name "VS Code cached extension packages"
Remove-Contents -Path $paths.VsCodeCachedData -Name "VS Code cached data"
Remove-Contents -Path $paths.VsCodeCache -Name "VS Code cache"
Remove-Contents -Path $paths.ChromeCodeCache -Name "Chrome code cache"
Remove-Contents -Path $paths.EdgeCodeCache -Name "Edge code cache"
Remove-Contents -Path $paths.CodexTmpA -Name "Codex temporary marketplace/cache files"
Remove-Contents -Path $paths.CodexTmpB -Name "Codex temporary files"

if ($GeneralSafe -or $IncludeWindowsTemp) {
    Remove-Contents -Path $paths.WindowsTemp -Name "Windows temp files older than $TempOlderThanDays days" -OlderThanDays $TempOlderThanDays
}

if ($GeneralSafe -or $IncludeCrashDumps) {
    Remove-Contents -Path $paths.CrashDumps -Name "Application crash dumps"
}

if ($GeneralSafe -or $IncludeBrowserCaches) {
    Remove-Contents -Path $paths.ChromeCache -Name "Chrome browser cache"
    Remove-Contents -Path $paths.ChromeGpuCache -Name "Chrome GPU cache"
    Remove-Contents -Path $paths.ChromeServiceWorkerCache -Name "Chrome service worker cache"
    Remove-Contents -Path $paths.ChromeExtensionsCache -Name "Chrome extension package cache"
    Remove-Contents -Path $paths.ChromeComponentsCache -Name "Chrome component package cache"
    Remove-Contents -Path $paths.EdgeCache -Name "Edge browser cache"
    Remove-Contents -Path $paths.EdgeGpuCache -Name "Edge GPU cache"
    Remove-Contents -Path $paths.EdgeServiceWorkerCache -Name "Edge service worker cache"
}

if ($GeneralSafe -or $IncludeSteamCache) {
    Remove-Contents -Path $paths.SteamHtmlCache -Name "Steam HTML cache"
}

if ($IncludeNvidiaDxCache) {
    Remove-Contents -Path $paths.NvidiaDxCache -Name "NVIDIA DirectX shader cache"
}

if ($IncludeRecycleBin) {
    $before = Get-PathSizeBytes $paths.RecycleBin
    if ($before -gt 0) {
        $script:Results += [pscustomobject]@{
            Action = if ($Execute) { "Command" } else { "Would run" }
            Name = "Recycle Bin"
            GB = ConvertTo-Gb $before
            Path = "Clear-RecycleBin -DriveLetter C -Force"
        }
        if ($Execute -and (Get-Command Clear-RecycleBin -ErrorAction SilentlyContinue)) {
            Clear-RecycleBin -DriveLetter C -Force
        }
    }
}

if ($IncludeWpsBackups) {
    Remove-Contents -Path $paths.WpsBackup -Name "WPS backup files"
    Remove-Contents -Path $paths.WpsCache -Name "WPS cache"
    Remove-Contents -Path $paths.WpsLog -Name "WPS logs"
}

if ($IncludeGameCaches) {
    Remove-Contents -Path $paths.NaughtyDogUncharted4 -Name "Uncharted 4 game cache/data under ProgramData"
}

if ($IncludeJetBrainsIndexes) {
    $jetBrainsRoot = Join-Path $UserProfilePath "AppData\Local\JetBrains"
    $jetBrainsTargets = @("index", "caches", "log", "jcef_cache", "full-line")
    if (Test-Path -LiteralPath $jetBrainsRoot) {
        Get-ChildItem -LiteralPath $jetBrainsRoot -Directory -Force | ForEach-Object {
            foreach ($target in $jetBrainsTargets) {
                Remove-Contents -Path (Join-Path $_.FullName $target) -Name "JetBrains $($_.Name) $target"
            }
        }
    }
}

if ($IncludeDockerPrune) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        $script:Results += [pscustomobject]@{
            Action = if ($Execute) { "Command" } else { "Would run" }
            Name = "Docker prune unused containers/images/build cache"
            GB = 0
            Path = "docker system prune --all --volumes --force"
        }
        if ($Execute) {
            docker system prune --all --volumes --force
        }
    }
}

if ($script:Results.Count -eq 0) {
    Write-Host "No cleanup candidates found."
} else {
    $script:Results | Sort-Object GB -Descending | Format-Table -AutoSize
    $total = ($script:Results | Measure-Object -Property GB -Sum).Sum
    Write-Host ""
    Write-Host ("Estimated listed cleanup: {0} GB" -f ([math]::Round($total, 2)))
}

Write-Host ""
if (-not $Execute) {
    Write-Host "Dry run only. Re-run with -Execute to clean."
    Write-Host "Useful bundles: -GeneralSafe"
    Write-Host "Optional larger/riskier items: -IncludeNvidiaDxCache, -IncludeRecycleBin, -IncludeWpsBackups, -IncludeGameCaches, -IncludeJetBrainsIndexes, -IncludeDockerPrune"
} else {
    Write-Host "Cleanup finished. Some locked files may remain; close apps and run again if needed."
}
