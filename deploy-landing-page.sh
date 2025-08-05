#!/bin/bash

echo "🚀 SPARK LANDING PAGE DEPLOYMENT SCRIPT"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    echo "Please run this script from your spark-mvp project root"
    exit 1
fi

# Check if landing page exists
if [ ! -f "app/landing/page.js" ]; then
    echo "❌ Error: app/landing/page.js not found"
    echo "Make sure the landing page file exists"
    exit 1
fi

echo "✅ Found landing page file"

# Show current git status
echo ""
echo "📋 Current Git Status:"
git status

echo ""
echo "📁 Files to be deployed:"
echo "  ✅ app/landing/page.js (New Gen Z landing page)"
echo "  ✅ app/page.js (Root redirect)"
echo "  ✅ app/globals.css (Updated fonts)"
echo "  ✅ tailwind.config.js (Design system)"

echo ""
echo "🔄 Adding files to Git..."
git add app/landing/
git add app/page.js
git add app/globals.css
git add tailwind.config.js

echo ""
echo "📦 Committing changes..."
git commit -m "feat: Add Gen Z landing page with dark theme and AI features

- New landing page at /landing with dark theme (#0F0F1A)
- Purple/pink gradients (#8A2BE2 to #FF1493)
- AI voice generation features with waveform
- Creator cards (Lena, Alex, Brianna)
- Mobile responsive design
- Root redirect from / to /landing
- Updated fonts (Inter) and design system"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "⏱️  Expected timeline:"
echo "  • GitHub push: ✅ Complete"
echo "  • Vercel build: 2-3 minutes"
echo "  • Live site: 3-4 minutes total"
echo ""
echo "🌐 Your live sites will show the new landing page at:"
echo "  • https://www.sparkplatform.tech/"
echo "  • https://spark-mvp-three.vercel.app/"
echo ""
echo "Wait 3-4 minutes, then check your live sites!"