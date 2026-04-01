@echo off
echo.
echo ========================================
echo   BrioDo Build ^& Install - Galaxy S24
echo ========================================
echo.

cd /d D:\Project\BrioDo

echo [1/5] npm run build...
call npm run build
if %errorlevel% neq 0 ( echo ERROR: npm run build failed & pause & exit /b 1 )

echo.
echo [2/5] cap sync android...
call npx cap sync android
if %errorlevel% neq 0 ( echo ERROR: cap sync failed & pause & exit /b 1 )

echo.
echo [3/5] gradlew assembleDebug...
cd android
call gradlew assembleDebug --quiet
if %errorlevel% neq 0 ( echo ERROR: gradle build failed & pause & exit /b 1 )
cd ..

echo.
echo [4/5] adb install...
"C:\Users\jeiel\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s R3CWC0KB53Z install -r "D:\Project\BrioDo\android\app\build\outputs\apk\debug\app-debug.apk"
if %errorlevel% neq 0 ( echo ERROR: adb install failed & pause & exit /b 1 )

echo.
echo [5/5] Launch app...
"C:\Users\jeiel\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s R3CWC0KB53Z shell am start -n app.briodo/.MainActivity

echo.
echo ========================================
echo   Done! Check your device.
echo ========================================
echo.
pause
