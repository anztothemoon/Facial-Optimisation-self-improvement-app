# Enables GitHub Pages: branch main, folder /docs (GitHub REST API).
# Requires: $env:GITHUB_TOKEN — classic PAT with `repo` scope, or fine-grained with Administration on this repo.
# Create: https://github.com/settings/tokens
#
# Usage:
#   $env:GITHUB_TOKEN = "ghp_...."
#   .\scripts\enable-github-pages.ps1

param(
    [string] $Owner = "anztothemoon",
    [string] $Repo = "Facial-Optimisation-self-improvement-app",
    [string] $Branch = "main",
    [string] $Path = "/docs"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
    Write-Host "Set GITHUB_TOKEN first. Example:" -ForegroundColor Yellow
    Write-Host '  $env:GITHUB_TOKEN = "ghp_your_classic_pat_here"' -ForegroundColor Gray
    Write-Host "Then run: .\scripts\enable-github-pages.ps1" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    Authorization          = "Bearer $($env:GITHUB_TOKEN.Trim())"
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

function Get-StatusCode {
    param($ErrorRecord)
    try {
        return [int]$ErrorRecord.Exception.Response.StatusCode
    } catch {
        return 0
    }
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
