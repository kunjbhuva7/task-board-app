#!/bin/bash
set -e

echo "--- 🚀 STARTING ONE-CLICK DEPLOYMENT TO 165.227.195.12 ---"

# Step 1: Build the frontend locally
echo "📦 Building React frontend locally..."
cd frontend
npm install
npm run build
cd ..

# Step 2: Sync files to remote server
echo "🔄 Syncing files to remote VPS..."
rsync -avz -e "ssh -o StrictHostKeyChecking=no" --exclude 'node_modules' --exclude '.git' --exclude 'frontend/node_modules' --exclude 'frontend/src' --exclude 'frontend/public' ./ root@165.227.195.12:/var/www/task-board/

# Step 3: Configure remote server, launch backend PM2 & reload Nginx
echo "⚙️ Configuring remote server via SSH..."
ssh -o StrictHostKeyChecking=no root@165.227.195.12 << 'EOF'
  # 1. Upgrade Node.js to 20 (LTS) and install Nginx if not present
  echo "Ensuring Node.js 20 (LTS) is installed on VPS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get update && apt-get install -y nodejs build-essential sqlite3
  
  if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update && apt-get install -y nginx
  fi

  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
  fi

  # Make sure the directory has correct permissions for Nginx
  mkdir -p /var/www/task-board
  chown -R www-data:www-data /var/www/task-board

  # 2. Setup backend and rebuild native binaries for Node 20 compatibility
  cd /var/www/task-board/backend
  echo "Installing backend dependencies..."
  npm install
  
  echo "🔨 Rebuilding native dependencies (better-sqlite3) for Node 20..."
  echo "⚠️ This compiles C++ code on your 1GB RAM VPS. It will take 1 to 2 minutes, showing active compilation logs. Please do NOT abort!"
  npm rebuild --verbose
  
  # Force reset admin database credentials and permissions explicitly
  echo "Force resetting admin database credentials..."
  node reset.js
  
  # Delete any old PM2 process to prevent directory/path mismatches (e.g. /root/task-board vs /var/www/task-board)
  echo "Stopping and cleaning up any stale PM2 processes..."
  pm2 delete taskboard-backend || true
  
  echo "Starting backend with PM2 from /var/www/task-board..."
  pm2 start server.js --name "taskboard-backend"
  pm2 save

  # 3. Setup Nginx reverse proxy
  echo "Configuring Nginx reverse proxy..."
  cp /var/www/task-board/default_nginx /etc/nginx/sites-available/default

  # Give ownership to Nginx again after npm install / files write
  chown -R www-data:www-data /var/www/task-board

  # Test & reload Nginx
  nginx -t
  systemctl restart nginx
  echo "✅ Server successfully configured and running!"
EOF

echo "--- 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! ---"
echo "Open http://165.227.195.12 on your device to test your ExpenseTracker PWA mobile app!"
