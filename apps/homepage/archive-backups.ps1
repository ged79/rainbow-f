# Homepage 백업 파일 아카이브 이동 스크립트
# 실행: PowerShell에서 .\archive-backups.ps1

$archiveRoot = "C:\work_station\flower\apps\homepage\_archive\api_backups_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 아카이브 디렉토리 생성
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$backupFiles = @(
    "C:\work_station\flower\apps\homepage\src\app\api\orders\route.old.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\orders\route.fixed.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\orders\route.production.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\orders\route.test.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.old.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.fixed.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.simple.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\auth\login\route.backup.ts",
    "C:\work_station\flower\apps\homepage\src\app\api\auth\login\route.secure.ts"
)

Write-Host "아카이브 이동: $archiveRoot" -ForegroundColor Cyan

$moved = 0
foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        $relativePath = $file -replace [regex]::Escape("C:\work_station\flower\apps\homepage\src\app\api\"), ""
        $destPath = Join-Path $archiveRoot $relativePath
        $destDir = Split-Path $destPath -Parent
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        Move-Item -Path $file -Destination $destPath -Force
        Write-Host "✓ $relativePath" -ForegroundColor Green
        $moved++
    }
}

Write-Host "`n완료: $moved 개 파일 이동" -ForegroundColor Green
