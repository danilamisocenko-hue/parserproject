@echo off
setlocal enabledelayedexpansion
title PARSER by FRESKO CT - Installer
color 0b

echo ======================================================
echo           PARSER by FRESKO CT (@Fresko_CT)
echo           АВТОМАТИЧЕСКАЯ УСТАНОВКА И ЗАПУСК
echo ======================================================
echo.

:: 1. Проверка Node.js
echo [1/6] Проверка окружения...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не найден! 
    echo Сейчас откроется страница загрузки...
    start https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
    echo Установите Node.js и запустите этот файл снова.
    pause
    exit
)
echo OK: Node.js установлен.

:: 2. Установка зависимостей
echo [2/6] Установка библиотек (это важно)...
call npm install --quiet

:: 3. Сборка интерфейса
echo [3/6] Сборка интерфейса (оптимизация)...
call npm run build

:: 4. Установка браузера
echo [4/6] Настройка движка парсинга (Chromium)...
call npx playwright install chromium

:: 5. Создание ярлыка на рабочем столе
echo [5/6] Создание ярлыка на рабочем столе...
set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\PARSER Fresko CT.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0INSTALL_AND_RUN.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0public\favicon.ico" >> %SCRIPT%
echo oLink.Description = "Запуск PARSER by FRESKO CT" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

:: 6. Запуск
echo [6/6] Все готово! Запускаю приложение...
echo.
echo Удачной охоты за контактами!
echo.
call npm start
pause
