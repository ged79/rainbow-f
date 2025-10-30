# Homepage 백업 파일 아카이브 이동 스크립트
# 실행: PowerShell에서 .\archive-backups.ps1

$archiveRoot = "C:\work_station\flower\apps\homepage\src\app\api\_archive"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 아카이브 디렉토리 생성
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null

$backupFiles = @(
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\orders\route.old.ts"
        Dest = "$archiveRoot\orders_route.old_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\orders\route.fixed.ts"
        Dest = "$archiveRoot\orders_route.fixed_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\orders\route.production.ts"
        Dest = "$archiveRoot\orders_route.production_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\orders\route.test.ts"
        Dest = "$archiveRoot\orders_route.test_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.old.ts"
        Dest = "$archiveRoot\payment_confirm_route.old_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.fixed.ts"
        Dest = "$archiveRoot\payment_confirm_route.fixed_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\payment\confirm\route.simple.ts"
        Dest = "$archiveRoot\payment_confirm_route.simple_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\auth\login\route.backup.ts"
        Dest = "$archiveRoot\auth_login_route.backup_$timestamp.ts"
    },
    @{
        Source = "C:\work_station\flower\apps\homepage\src\app\api\auth\login\route.secure.ts"
        Dest = "$archiveRoot\auth_login_route.secure_$timestamp.ts"
    }
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "백업 파일 아카이브 이동" -ForegroundColor Cyan
Write-Host "대상: $archiveRoot" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$moved = 0
$notFound = 0

foreach ($file in $backupFiles) {
    if (Test-Path $file.Source) {
        Write-Host "이동: $(Split-Path $file.Source -Leaf)" -ForegroundColor Yellow
        Move-Item -Path $file.Source -Destination $file.Dest -Force
        Write-Host "  → $(Split-Path $file.Dest -Leaf)" -ForegroundColor Green
        $moved++
    } else {
        Write-Host "없음: $(Split-Path $file.Source -Leaf)" -ForegroundColor Gray
        $notFound++
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "완료: $moved 개 이동, $notFound 개 없음" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
