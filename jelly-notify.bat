@echo off
cls
cd /d "%~dp0"
title Jelly Notify
node src\index.js
pause >nul
exit