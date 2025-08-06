#!/bin/bash

echo "🚨 EMERGENCY DEPLOYMENT - MISSING LANDING PAGE FIX"
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in project root directory!"
    echo "Please navigate to your spark-mvp project directory first"
    echo "Run: cd /path/to/your/spark-mvp-project"
    exit 1
fi

# Check if landing page exists locally
if [ ! -f "app/landing/page.js" ]; then
    echo "❌ ERROR: app/landing/page.js not found locally!"
    echo "The landing page file is missing from your local project"
    exit 1
fi

echo "✅ Found landing page file locally"

# Show file size to confirm it's the right file
ls -lh app/landing/page.js

echo ""
echo "🔍 Current Git Status:"
git status

echo ""
echo "🚨 FORCE ADDING LANDING PAGE FILES..."

# Force add all necessary files
git add -f app/landing/
git add -f app/page.js
git add -f app/globals.css
git add -f tailwind.config.js

echo ""
echo "📦 Creating emergency commit..."
git commit -m "EMERGENCY FIX: Add missing landing page files

CRITICAL ISSUE RESOLVED:
- app/landing/page.js was missing from GitHub
- This caused 404 errors on /landing route
- Old homepage was still showing on live site

CHANGES:
- Add complete landing page with Gen Z design
- Dark theme (#0F0F1A) with purple/pink gradients
- AI voice features and creator cards
- Mobile responsive design
- Root redirect from / to /landing

FIXES:
- 404 error on sparkplatform.tech/landing
- Old 'Smarter Campaigns' homepage issue
- Missing Gen Z landing page deployment"

echo ""
echo "🚀 FORCE PUSHING TO GITHUB..."
git push origin main

echo ""
echo "✅ EMERGENCY DEPLOYMENT COMPLETE!"
echo ""
echo "⏱️  EXPECTED TIMELINE:"
echo "  • GitHub push: ✅ Complete"
echo "  • Vercel auto-build: 2-3 minutes"
echo "  • Live site update: 3-4 minutes total"
echo ""
echo "🌐 VERIFICATION URLS:"
echo "  • https://sparkplatform.tech/"
echo "  • https://sparkplatform.tech/landing"
echo ""
echo "🔧 NEXT STEPS:"
echo "  1. Wait 3-4 minutes for Vercel to rebuild"
echo "  2. Test both URLs above"
echo "  3. Verify new 'Powerful campaigns for creators' headline"
echo "  4. Confirm dark theme and Gen Z design"
echo ""
echo "If still not working after 5 minutes, trigger manual Vercel redeploy"