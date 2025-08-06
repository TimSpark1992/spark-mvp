#!/bin/bash

echo "🚀 Starting Spark Landing Page Deployment..."

# Add all changes
git add .

# Commit with a message
git commit -m "🚀 Deploy new landing page"

# Push to GitHub
git push origin main

echo "✅ Deployment pushed to GitHub. Vercel will now deploy automatically."

echo "🌐 Check your domain shortly (e.g., https://sparkplatform.tech)"

