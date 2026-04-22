#!/bin/bash
# Stop PSL Karting App Servers (Mac equivalent of stop_app.bat)

echo "=========================================="
echo "   Stopping PSL Karting App Servers"
echo "=========================================="

echo "Stopping processes on Port 3000 (Frontend) and 3001 (Backend)..."

for PORT in 3000 3001; do
    PIDS=$(lsof -ti tcp:$PORT)
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            kill -9 "$PID" 2>/dev/null && echo "Stopped Process ID: $PID (port $PORT)"
        done
    else
        echo "No process running on port $PORT"
    fi
done

echo ""
echo "All app servers have been stopped."
echo ""
read -n 1 -s -r -p "Press any key to close this window..."
echo ""