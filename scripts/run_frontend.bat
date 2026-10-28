@echo off
cd /d "%~dp0\..\frontend"
set PATH=C:\Program Files\nodejs;%PATH%
echo Starting Urban Infrastructure Intelligence Frontend on http://127.0.0.1:5173 ...
call npm.cmd run dev
pause
