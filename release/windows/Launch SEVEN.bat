@echo off
rem SEVEN - one-click launcher for Windows.
rem Opens the self-contained game file in Microsoft Edge "app" mode (a clean window
rem without browser tabs). Falls back to your default browser. No install, no
rem admin rights, no network access needed. Your career is saved by the browser
rem (IndexedDB) on this computer.
setlocal
set "GAME=%~dp0SEVEN.html"
if not exist "%GAME%" (
  echo SEVEN.html was not found next to this launcher.
  pause
  exit /b 1
)
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" --app="file:///%GAME:\=/%" --window-size=520,940
) else (
  start "" "%GAME%"
)
endlocal
