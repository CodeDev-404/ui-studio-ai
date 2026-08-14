#!/data/data/com.termux/files/usr/bin/bash
# UI Studio - arranca el servidor (puerto 3456)
cd "$(dirname "$0")"
PIDFILE="server/.server.pid"
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE")
  kill "$OLD_PID" 2>/dev/null
  sleep 0.5
  rm -f "$PIDFILE"
fi
node server/index.js > server/server.log 2>&1 &
echo $! > "$PIDFILE"
sleep 1.5
curl -s -o /dev/null -w "UI Studio listo en http://localhost:3456 (http_code: %{http_code})\n" http://localhost:3456/
