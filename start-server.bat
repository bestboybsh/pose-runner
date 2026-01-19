@echo off
echo Starting local server for Pose Runner...
echo.
echo Server will start at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Try Python 3 first
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    REM Try Python 2
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Python not found!
        echo Please install Python or use one of these options:
        echo   1. Install Python from https://www.python.org/
        echo   2. Install Node.js and use: npx http-server -p 8000
        echo   3. Use VS Code Live Server extension
        echo.
        pause
    )
)
