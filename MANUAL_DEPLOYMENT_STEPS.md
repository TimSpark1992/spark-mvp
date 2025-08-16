# 🚀 MANUAL DEPLOYMENT GUIDE - Spark Landing Page

## Step-by-Step Instructions

### **Step 1: Navigate to Your Project Directory**
```bash
cd path/to/your/spark-mvp-project
```

### **Step 2: Verify Files Exist**
```bash
# Check if landing page exists
ls -la app/landing/page.js

# Should show: app/landing/page.js (14741 bytes)
```

### **Step 3: Add Files to Git**
```bash
# Add the new landing directory
git add app/landing/

# Add updated files
git add app/page.js
git add app/globals.css  
git add tailwind.config.js
```

### **Step 4: Check What Will Be Committed**
```bash
git status
```
You should see:
- `new file: app/landing/page.js`
- `modified: app/page.js`
- `modified: app/globals.css`
- `modified: tailwind.config.js`

### **Step 5: Commit Changes**
```bash
git commit -m "feat: Add Gen Z landing page with dark theme and AI features"
```

### **Step 6: Push to GitHub**
```bash
git push origin main
```

### **Step 7: Wait for Deployment**
- **Vercel will automatically build**: 2-3 minutes
- **Live site will update**: 30 seconds after build
- **Total time**: 3-4 minutes

### **Step 8: Verify Deployment**
Test these URLs after 3-4 minutes:
- https://www.sparkplatform.tech/ (should redirect to landing)
- https://www.sparkplatform.tech/landing (direct access)
- https://spark-mvp-three.vercel.app/ (should redirect to landing)

## Expected Results

### **Before (Current):**
- Light theme homepage
- "Smarter Campaigns. Spark is Your All-Powered Growth Platform"

### **After (New Landing Page):**
- 🎨 Dark theme background (#0F0F1A)
- 💜 "Powerful campaigns for creators" 
- ✨ Purple/pink gradients
- 🎵 AI voice generation features
- 👥 Creator cards (Lena, Alex, Brianna)
- 📱 Mobile responsive design

## If You Have Issues

### **Common Problems:**

**1. "Not a git repository"**
```bash
git init
git remote add origin https://github.com/TimSpark1992/spark-mvp.git
```

**2. "Permission denied"**
```bash
# Make sure you're logged into GitHub
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**3. "Files not found"**
Make sure you're in the correct directory with `package.json`

### **Alternative: Use GitHub Desktop**
1. Open GitHub Desktop
2. Select your spark-mvp repository
3. You should see the new/modified files
4. Add commit message: "Add Gen Z landing page"
5. Click "Commit to main"
6. Click "Push origin"

## Verification Commands

After deployment, test:
```bash
curl -I https://www.sparkplatform.tech/landing
curl -I https://spark-mvp-three.vercel.app/landing
```
Both should return `200 OK` status.