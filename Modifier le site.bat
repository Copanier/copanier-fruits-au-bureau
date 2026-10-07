@echo off
chcp 65001 >nul
title COPANIER - Modifier le site
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js n'est pas installe sur cet ordinateur.
  echo   Installez-le depuis https://nodejs.org puis relancez ce fichier.
  echo.
  pause
  exit /b
)
node "outils\serveur.mjs"
pause
