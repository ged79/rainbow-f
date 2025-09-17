@echo off
echo Creating backup...
mkdir backup_client_2025
xcopy *.bat backup_client_2025\ /Y
xcopy *.sh backup_client_2025\ /Y
xcopy *.md backup_client_2025\ /Y
xcopy *.json backup_client_2025\ /Y
xcopy next.config.*.js backup_client_2025\ /Y
xcopy test-*.js backup_client_2025\ /Y
echo Backup complete in backup_client_2025/