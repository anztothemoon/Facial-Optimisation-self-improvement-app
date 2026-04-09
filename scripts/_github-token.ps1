# Shared: resolve GitHub PAT from env or one-line file (avoids PowerShell quoting issues).
# Default file: repo root `.github-token` (gitignored).

$script:GitHubTokenScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-GitHubTokenResolved {
    param(
        [string] $TokenFile = (Join-Path (Split-Path $script:GitHubTokenScriptsDir -Parent) ".github-token")
    )

    $t = $null
    if ($env:GITHUB_TOKEN -and $env:GITHUB_TOKEN.Trim().Length -gt 0) {
        $t = $env:GITHUB_TOKEN.Trim()
    }

    if (-not $t -and $TokenFile -and (Test-Path -LiteralPath $TokenFile)) {
        $path = (Resolve-Path -LiteralPath $TokenFile).Path
        $raw = [System.IO.File]::ReadAllText($path)
        # Strip UTF-8 BOM if Notepad saved as UTF-8 with BOM
        if ($raw.Length -gt 0 -and [int][char]$raw[0] -eq 0xFEFF) {
            $raw = $raw.Substring(1)
        }
        $t = ($raw -split "`r?`n")[0].Trim()
    }

    if ($t) {
        # User pasted including quotes
        if (($t.StartsWith('"') -and $t.EndsWith('"')) -or ($t.StartsWith([char]0x201C) -and $t.EndsWith([char]0x201D))) {
            $t = $t.Trim('"', [char]0x201C, [char]0x201D).Trim()
        }
        if ($t.StartsWith("'") -and $t.EndsWith("'")) {
            $t = $t.Substring(1, $t.Length - 2).Trim()
        }
        # Remove stray whitespace / zero-width chars (rare paste issues)
        $t = $t.Trim() -replace "[\u200B-\u200D\uFEFF]", ""
    }

    return $t
}
