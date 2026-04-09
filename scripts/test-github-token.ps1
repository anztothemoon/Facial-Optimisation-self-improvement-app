# Verifies your PAT works with api.github.com (GET /user).
# Use a one-line file to avoid quote/clipboard issues.
#
# Usage:
#   .\scripts\test-github-token.ps1
#   .\scripts\test-github-token.ps1 -TokenFile C:\path\to\file.txt

param(
    [string] $TokenFile = (Join-Path (Split-Path $PSScriptRoot -Parent) ".github-token")
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\_github-token.ps1"
$token = Get-GitHubTokenResolved -TokenFile $TokenFile

if (-not $token) {
    Write-Host "No token found." -ForegroundColor Red
    Write-Host "Option A (recommended): create this file with ONE line = your token, no quotes:" -ForegroundColor Yellow
    Write-Host "  $TokenFile" -ForegroundColor Gray
    Write-Host "Option B: env var in this PowerShell window only:" -ForegroundColor Yellow
    Write-Host '  $env:GITHUB_TOKEN = "ghp_...."' -ForegroundColor Gray
    exit 1
}

$prefix = if ($token.Length -ge 4) { $token.Substring(0, [Math]::Min(12, $token.Length)) } else { "???" }
Write-Host "Using token starting with: $prefix..." -ForegroundColor DarkGray
Write-Host "Length (chars): $($token.Length)" -ForegroundColor DarkGray

$headers = @{
    Authorization          = "Bearer $token"
    Accept                   = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

try {
    $u = Invoke-RestMethod -Uri "https://api.github.com/user" -Method Get -Headers $headers
    Write-Host "OK - authenticated as: $($u.login)" -ForegroundColor Green
    exit 0
}
catch {
    $code = 0
    try {
        $code = [int]$_.Exception.Response.StatusCode.value__
    }
    catch { }
    Write-Host "FAILED - HTTP $code" -ForegroundColor Red
    if ($code -eq 401) {
        Write-Host "Token is invalid, expired, or revoked. Create a new PAT." -ForegroundColor Yellow
        Write-Host "Save the token as a single line in .github-token (no spaces before/after)." -ForegroundColor Yellow
    }
    exit 1
}
