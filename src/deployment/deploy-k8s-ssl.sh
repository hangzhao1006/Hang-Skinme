#!/bin/bash

# Deploy with HTTPS/SSL support
# This script deploys to the 'ssl' stack which enables HTTPS

echo "🔒 Deploying with HTTPS/SSL enabled..."

# Step 1: Build and push Docker images
cd deploy_images
echo "📦 Building and pushing container images..."
pulumi stack select dev
pulumi up --stack dev -y

# Step 2: Deploy to K8s with SSL
cd ../deploy_k8s
echo "🚀 Deploying to Kubernetes with SSL...(https)"
pulumi stack select ssl
pulumi up --stack ssl -y

echo "🚀 Deploying to Kubernetes (dev, http)..."
pulumi stack select dev
pulumi up --stack dev -y

echo ""
echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Get the static IP address from the output"
echo "2. Add DNS A record pointing skinthecode.com to that IP"
echo "3. Wait 10-20 minutes for SSL certificate provisioning"
echo "4. Access your app at: https://skinthecode.com"
