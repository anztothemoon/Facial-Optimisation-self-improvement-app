# Enables GitHub Pages: branch main, folder /docs (GitHub REST API).
# Requires: classic PAT (`repo`) or fine-grained (this repo + Administration read/write).
# Create: https://github.com/settings/tokens
#
# Token (pick one — file avoids PowerShell quote issues):
#   1) One-line file: repo root `.github-token` (gitignored) — paste token only, no quotes
#   2) $env:GITHUB_TOKEN = "ghp_...." in this shell
#
# Usage:
#   .\scripts\enable-github-pages.ps1
#   .\scripts\enable-github-pages.ps1 -TokenFile D:\safe\pat.txt

param(
    [string] $Owner = "anztothemoon",
    [string] $Repo = "Facial-Optimisation-self-improvement-app",
    [string] $Branch = "main",
    [string] $Path = "/docs",
    [string] $TokenFile = ""
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\_github-token.ps1"
if ($TokenFile) {
    $ghPat = Get-GitHubTokenResolved -TokenFile $TokenFile
} else {
    $ghPat = Get-GitHubTokenResolved
}

if (-not $ghPat) {
    Write-Host "No GitHub token found." -ForegroundColor Yellow
    Write-Host "Easiest: create a file named .github-token in the repo root (same folder as package.json)." -ForegroundColor Gray
    Write-Host "  Put ONE line: your token only (ghp_... or github_pat_...), no quotes, then save." -ForegroundColor Gray
    Write-Host "Or set: `$env:GITHUB_TOKEN = '...'`" -ForegroundColor Gray
    Write-Host "Test first: .\scripts\test-github-token.ps1" -ForegroundColor Cyan
    exit 1
}

$headers = @{
    Authorization          = "Bearer $ghPat"
    Accept                   = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$uri = "https://api.github.com/repos/$Owner/$Repo/pages"

$bodyObj = @{
    source = @{
        branch = $Branch
        path   = $Path
    }
}
$bodyJson = $bodyObj | ConvertTo-Json -Depth 5 -Compress

$repoUri = "https://api.github.com/repos/$Owner/$Repo"

function Get-StatusCode {
    param($ErrorRecord)
    try {
        return [int]$ErrorRecord.Exception.Response.StatusCode
    } catch {
        return 0
    }
}

# --- Preflight: token must be able to see the repo (fine-grained tokens need this repo selected) ---
try {
    $null = Invoke-RestMethod -Uri $repoUri -Method Get -Headers $headers
} catch {
    $code = Get-StatusCode $_
    if ($code -eq 401) {
        Write-Host "HTTP 401 — GitHub rejected this token (not a private-repo issue)." -ForegroundColor Red
        Write-Host "Fix: create a NEW token at https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "  • Copy the token once; no extra spaces or line breaks." -ForegroundColor Gray
        Write-Host '  • $env:GITHUB_TOKEN = "paste_here"  (use straight quotes)' -ForegroundColor Gray
        Write-Host "  • Classic: enable scope `repo`. Fine-grained: add this repo + Administration read/write." -ForegroundColor Gray
        Write-Host "  • Sanity check: same token must work for GET https://api.github.com/user (see GitHub REST docs)." -ForegroundColor DarkGray
        exit 1
    }
    if ($code -eq 404) {
        Write-Host "This token cannot access $Owner/$Repo (HTTP 404)." -ForegroundColor Red
        Write-Host "If you use a fine-grained PAT: GitHub → Settings → Developer settings → edit the token →" -ForegroundColor Yellow
        Write-Host "  Repository access: add this repository (or All repositories)." -ForegroundColor Yellow
        Write-Host "  Permissions → Repository → Administration: Read and write." -ForegroundColor Yellow
        Write-Host "Or use a classic PAT with the 'repo' scope." -ForegroundColor Yellow
        exit 1
    }
    throw
}

# --- GET: does Pages exist? ---
try {
    $current = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
    $src = $current.source
    $same = ($src.branch -eq $Branch) -and ($src.path -eq $Path)
    if ($same) {
        Write-Host "GitHub Pages already uses $Branch and $Path. No change needed." -ForegroundColor Green
        Write-Host "Site: $($current.html_url)" -ForegroundColor Gray
        exit 0
    }
    Write-Host "Updating Pages source to $Branch $Path ..." -ForegroundColor Cyan
    $updated = Invoke-RestMethod -Uri $uri -Method Put -Headers $headers -Body $bodyJson -ContentType "application/json"
    Write-Host "Updated." -ForegroundColor Green
    $updated | ConvertTo-Json -Depth 6
    exit 0
} catch {
    $code = Get-StatusCode $_
    if ($code -ne 404) {
        Write-Host "GET/PUT failed (HTTP $code). Open the UI or check token permissions:" -ForegroundColor Red
        Write-Host "https://github.com/$Owner/$Repo/settings/pages" -ForegroundColor Gray
        throw
    }
}

# --- POST: create Pages site ---
try {
    $created = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $bodyJson -ContentType "application/json"
    Write-Host "GitHub Pages enabled: $Branch $Path" -ForegroundColor Green
    $created | ConvertTo-Json -Depth 6
    exit 0
} catch {
    $code = Get-StatusCode $_
    Write-Host "POST failed (HTTP $code). If Pages was created in the UI, try again or set source manually:" -ForegroundColor Yellow
    Write-Host "https://github.com/$Owner/$Repo/settings/pages" -ForegroundColor Gray
    throw
}
