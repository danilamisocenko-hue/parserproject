@echo off
echo [SEO VLESS TOOL] Начинаем установку...
echo Проверка Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен! Пожалуйста, установите его с https://nodejs.org/
    pause
    exit /b
)
echo Установка зависимостей...
call npm install
echo Установка браузеров (Playwright)...
npx playwright install chromium
echo.
echo Установка завершена! 
echo Чтобы запустить программу, введите: npm run dev
echo По умолчанию программа будет доступна по адресу: http://localhost:3000
pause
