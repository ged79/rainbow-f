# Homepage 백업 파일 정리 스크립트
# 실행: PowerShell에서 .\cleanup-backups.ps1

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

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "백업 파일 정리 시작" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        Write-Host "삭제: $file" -ForegroundColor Yellow
        Remove-Item $file -Force
        Write-Host "  ✓ 완료" -ForegroundColor Green
    } else {
        Write-Host "없음: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "정리 완료!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
