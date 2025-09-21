#!/bin/bash

# Script to update HOST_IP in docker-compose.yml for different networks
# Compatible with Linux, macOS, and Windows (via Git Bash or WSL)

echo "🔍 Detecting your current IP address..."

# Try different methods to get IP address based on OS
if command -v ip >/dev/null 2>&1; then
    # Linux with ip command
    CURRENT_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
elif command -v ifconfig >/dev/null 2>&1; then
    # macOS/BSD with ifconfig
    CURRENT_IP=$(ifconfig | grep -E "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
elif command -v Get-NetIPAddress >/dev/null 2>&1; then
    # Windows with PowerShell
    CURRENT_IP=$(powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.IPAddress -notlike '127.*' } | Select-Object -First 1 -ExpandProperty IPAddress" 2>/dev/null)
else
    echo "❌ Could not detect IP address. Please check your network connection."
    echo ""
    echo "💡 Manual workaround:"
    echo "   1. Find your IP manually (ipconfig on Windows, ifconfig on macOS/Linux)"
    echo "   2. Set environment variable: export HOST_IP='YOUR_IP_ADDRESS'"
    echo "   3. Run: docker-compose up -d"
    exit 1
fi

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect IP address. Please check your network connection."
    exit 1
fi

echo "✅ Detected IP address: $CURRENT_IP"

echo "🔄 Updating docker-compose.yml with new HOST_IP..."

# Create backup
cp docker-compose.yml docker-compose.yml.backup

# Update using different methods based on OS
if command -v sed >/dev/null 2>&1; then
    # Unix-like systems (Linux, macOS, WSL)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires different sed syntax
        sed -i '' "s|HOST_IP: \"\${HOST_IP:-[^\"]*}\"|HOST_IP: \"\${HOST_IP:-$CURRENT_IP}\"|g" docker-compose.yml
    else
        # Linux/WSL
        sed -i "s|HOST_IP: \"\${HOST_IP:-[^\"]*}\"|HOST_IP: \"\${HOST_IP:-$CURRENT_IP}\"|g" docker-compose.yml
    fi
elif command -v powershell >/dev/null 2>&1; then
    # Windows with PowerShell
    powershell -Command "
        \$content = Get-Content 'docker-compose.yml' -Raw
        \$newContent = \$content -replace 'HOST_IP: \"\$\{HOST_IP:-[^\"]*\}', \"HOST_IP: \"\$\{HOST_IP:-$CURRENT_IP}\"
        Set-Content -Path 'docker-compose.yml' -Value \$newContent
    "
else
    echo "❌ Could not update docker-compose.yml. Please update manually."
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated HOST_IP to: $CURRENT_IP"
    echo ""
    echo "🚀 To apply changes, run:"
    echo "   docker-compose down && docker-compose up --build -d"
    echo ""
    echo "🌐 Your application will be accessible at: http://$CURRENT_IP:3000"
    echo ""
    echo "💡 Backup created: docker-compose.yml.backup"
else
    echo "❌ Failed to update docker-compose.yml"
    echo "💡 Restoring backup..."
    mv docker-compose.yml.backup docker-compose.yml
    exit 1
fi
