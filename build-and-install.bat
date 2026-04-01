@echo off
chcp 65001 > nul
echo.
echo ========================================
echo   BrioDo 빌드 ^& Galaxy S24 설치
echo ========================================
echo.

cd /d D:\Project\BrioDo

echo [1/5] 웹 에셋 빌드 중...
call npm run build
if %errorlevel% neq 0 ( echo 오류: npm run build 실패 & pause & exit /b 1 )

echo.
echo [2/5] Android 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 ( echo 오류: cap sync 실패 & pause & exit /b 1 )

echo.
echo [3/5] APK 빌드 중...
cd android
call gradlew assembleDebug --quiet
if %errorlevel% neq 0 ( echo 오류: gradlew 빌드 실패 & pause & exit /b 1 )
cd ..

echo.
echo [4/5] Galaxy S24 설치 중...
"C:\Users\jeiel\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s R3CWC0KB53Z install -r "D:\Project\BrioDo\android\app\build\outputs\apk\debug\app-debug.apk"
if %errorlevel% neq 0 ( echo 오류: adb install 실패 & pause & exit /b 1 )

echo.
echo [5/5] 앱 실행 중...
"C:\Users\jeiel\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s R3CWC0KB53Z shell am start -n app.briodo/.MainActivity

echo.
echo ========================================
echo   완료! 디바이스에서 확인하세요.
echo ========================================
echo.
pause
