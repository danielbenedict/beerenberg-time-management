@echo off
SET DB_NAME=beerenberg_db
SET DB_USER=root
SET DB_PASS=Yul4ndKen 10
SET BACKUP_DIR=%~dp0backups

IF NOT EXIST "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

FOR /F "tokens=2-4 delims=/ " %%A IN ('date /T') DO (SET MM=%%A& SET DD=%%B& SET YY=%%C)
FOR /F "tokens=1-2 delims=: " %%A IN ('time /T') DO (SET HH=%%A& SET MN=%%B)
SET TIMESTAMP=%YY%%MM%%DD%_%HH%%MN%

SET BACKUP_FILE=%BACKUP_DIR%\beerenberg_backup_%TIMESTAMP%.sql

echo [%DATE% %TIME%] Starting database backup for %DB_NAME%...

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u%DB_USER% -p"%DB_PASS%" %DB_NAME% > "%BACKUP_FILE%"

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Backup successfully created at: %BACKUP_FILE%
) ELSE (
    echo [%DATE% %TIME%] Backup failed!
)