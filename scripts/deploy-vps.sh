#!/bin/bash
# Deploy Inventory Gudang to VPS
# Run this script on the VPS as root

# Create database
su - postgres -c "psql -c \"CREATE USER inventory WITH PASSWORD 'inv3nt0ry_s3cur3_2024';\" 2>/dev/null || echo 'User exists'"
su - postgres -c "psql -c \"CREATE DATABASE inventory_gudang OWNER inventory;\" 2>/dev/null || echo 'Database exists'"
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE inventory_gudang TO inventory;\""
su - postgres -c "psql inventory_gudang -c \"GRANT ALL ON SCHEMA public TO inventory;\""

echo "✓ Database setup complete"

# Clone repository
cd /var/www
rm -rf inventory-gudang
git clone https://github.com/armandawahyuu/sistem-inventory-gudang.git inventory-gudang
cd inventory-gudang

echo "✓ Repository cloned"

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://inventory:inv3nt0ry_s3cur3_2024@localhost:5432/inventory_gudang"
NEXTAUTH_SECRET="K8xYp2qN7vR4mT9wL6jF0hD3sG5aE1cB8uO2iP4nZ7mX"
NEXTAUTH_URL="http://38.47.176.141:3000"
ENCRYPTION_KEY="8f3d2e1a9b0c4d5e6f7g8h9i0j1k2l3m"
NODE_ENV="production"
EOF

echo "✓ Environment configured"

# Install dependencies
npm install

echo "✓ Dependencies installed"

# Generate Prisma client
npx prisma generate

echo "✓ Prisma client generated"

# Push database schema
npx prisma db push

echo "✓ Database schema pushed"

# Seed database (optional - creates admin user)
npx prisma db seed 2>/dev/null || echo "Seed skipped"

# Build
npm run build

echo "✓ Application built"

# Start with PM2
pm2 delete inventory-gudang 2>/dev/null || true
pm2 start npm --name "inventory-gudang" -- start
pm2 save

echo "✓ Application started with PM2"

# Show status
pm2 list

echo ""
echo "=============================================="
echo "🎉 Deployment Complete!"
echo "Access: http://38.47.176.141:3000"
echo "=============================================="
