@echo off
cls
cd /d "%~dp0"
title jelly-notify
node src\index.js
pause >nul
exit