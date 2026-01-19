#!/bin/bash

echo "Starting local server for Pose Runner..."
echo ""
echo "Server will start at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
# Try Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo ""
    echo "ERROR: Python not found!"
    echo "Please install Python or use one of these options:"
    echo "  1. Install Python: sudo apt install python3"
    echo "  2. Install Node.js and use: npx http-server -p 8000"
    echo "  3. Use VS Code Live Server extension"
    echo ""
    exit 1
fi
