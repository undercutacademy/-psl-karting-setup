#!/bin/bash
# Start PSL Karting App Servers (Mac)
# Runs backend + frontend in THIS terminal window (no AppleScript / no Automation permission needed).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/.dev-logs"
mkdir -p "$LOG_DIR"

echo "=========================================="
echo "   Starting PSL Karting App Servers"
echo "=========================================="

# 1. Kill any stale processes holding ports 3000/3001
echo ""
echo "Clearing ports 3000/3001..."
for PORT in 3000 3001; do
    PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            kill -9 "$PID" 2>/dev/null && echo "  Killed PID $PID on port $PORT"
        done
    fi
done
sleep 1

# 2. Start backend in the background (logs to file)
echo ""
echo "Starting Backend on port 3001 (logs: $LOG_DIR/backend.log)..."
(
    cd "$SCRIPT_DIR/backend" && npm run dev > "$LOG_DIR/backend.log" 2>&1
) &
BACKEND_PID=$!

# 3. Ensure backend dies if this terminal is closed or Ctrl+C'd
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null
    for PORT in 3000 3001; do
        PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
        [ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null
    done
    echo "Done."
}
trap cleanup EXIT INT TERM

# 4. Wait for backend to be up (max ~20s)
echo "Waiting for backend to respond..."
for i in {1..20}; do
    if curl -s http://localhost:3001/api/teams/hotz >/dev/null 2>&1; then
        echo "  Backend is up."
        break
    fi
    sleep 1
done

# 5. Start frontend in the foreground (logs stream here)
echo ""
echo "Starting Frontend on port 3000..."
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:3001 (logs tail: tail -f $LOG_DIR/backend.log)"
echo ""
echo "Press Ctrl+C in this window to stop BOTH servers."
echo "=========================================="
echo ""

cd "$SCRIPT_DIR/frontend" && npm run dev
