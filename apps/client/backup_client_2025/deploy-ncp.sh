#!/bin/bash
# NCP Server Deployment Script

# 1. Create NCP Server
echo "Create Ubuntu 20.04 server with:"
echo "- 2 vCPU, 4GB RAM"
echo "- Public IP"
echo "- Port 3000, 80, 443 open"

# 2. SSH into server and run:
ssh root@your-server-ip

# 3. Install Docker
apt update
apt install -y docker.io docker-compose
systemctl start docker

# 4. Transfer files
scp -r .next public package.json pnpm-lock.yaml Dockerfile root@your-server-ip:/app/

# 5. Build and run
cd /app
docker build -t flower-client .
docker run -d --name flower-client -p 80:3000 --restart always flower-client

# 6. Check status
docker logs flower-client