@echo off
setlocal EnableExtensions
cd /d "%~dp0"

git rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 goto :not_repo

for /f "delims=" %%B in ('git branch --show-current') do set "BRANCH=%%B"
if not defined BRANCH goto :no_branch

git remote get-url origin >nul 2>&1
if errorlevel 1 goto :no_origin

git status --porcelain --untracked-files=all | findstr /r /c:"." >nul
if not errorlevel 1 goto :local_changes

echo Checking GitHub branch: %BRANCH%
git fetch origin "%BRANCH%"
if errorlevel 1 goto :fetch_failed

git merge-base --is-ancestor HEAD "origin/%BRANCH%"
if errorlevel 1 goto :local_ahead_or_diverged

git merge --ff-only "origin/%BRANCH%"
if errorlevel 1 goto :pull_failed

echo.
echo Local folder was updated from GitHub.
goto :done

:local_changes
echo Local changes were found.
echo Run update-git-from-local.bat first, or commit them manually.
goto :failed

:local_ahead_or_diverged
git merge-base --is-ancestor "origin/%BRANCH%" HEAD
if not errorlevel 1 (
    echo Local branch is ahead of GitHub. Nothing was downloaded.
) else (
    echo Local and GitHub branches have diverged.
    echo Resolve the divergence manually before syncing.
    goto :failed
)
goto :done

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

:pull_failed
echo GitHub changes could not be applied with fast-forward only.
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
