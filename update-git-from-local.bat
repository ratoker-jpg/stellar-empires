@echo off
setlocal EnableExtensions
cd /d "%~dp0"

git rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 goto :not_repo

for /f "delims=" %%B in ('git branch --show-current') do set "BRANCH=%%B"
if not defined BRANCH goto :no_branch

git remote get-url origin >nul 2>&1
if errorlevel 1 goto :no_origin

echo Checking GitHub branch: %BRANCH%
git fetch origin "%BRANCH%"
if errorlevel 1 goto :fetch_failed

git merge-base --is-ancestor "origin/%BRANCH%" HEAD
if errorlevel 1 goto :remote_ahead

git status --porcelain --untracked-files=all | findstr /r /c:"." >nul
if errorlevel 1 goto :nothing_to_commit

echo Staging local changes...
git add -A
if errorlevel 1 goto :failed

git diff --cached --diff-filter=D --name-only | findstr /r /c:"." >nul
if not errorlevel 1 goto :deleted_files

if "%~1"=="" (
    set "COMMIT_MESSAGE=chore: sync local changes"
) else (
    set "COMMIT_MESSAGE=%*"
)

git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto :failed

git push origin "%BRANCH%"
if errorlevel 1 goto :push_failed

echo.
echo Local changes were committed and pushed to GitHub.
goto :done

:nothing_to_commit
echo No local changes to send.
goto :done

:remote_ahead
echo GitHub has commits that are missing locally.
echo Run update-local-from-git.bat first, then retry this script.
goto :failed

:not_repo
echo This folder is not a Git repository.
goto :failed

:no_branch
echo The current Git state has no active branch.
goto :failed

:no_origin
echo Remote "origin" is not configured.
goto :failed

:fetch_failed
echo Could not read the GitHub branch.
goto :failed

:push_failed
echo Push failed. No force-push was attempted.
goto :failed

:deleted_files
echo Deleted files were detected after staging.
echo The script will not publish deletions automatically.
echo Review them, then commit manually if the deletions are intentional.
goto :failed

:failed
echo.
echo Nothing was force-overwritten.
set "EXIT_CODE=1"
goto :finish

:done
set "EXIT_CODE=0"

:finish
pause
exit /b %EXIT_CODE%
