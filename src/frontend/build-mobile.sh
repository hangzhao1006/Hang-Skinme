#!/bin/bash

# SkinMe AI - Mobile Build Script
# This script builds the Next.js app and syncs it to iOS/Android

echo "🚀 Building SkinMe AI Mobile App..."
echo ""

# Step 1: Build Next.js as static site
echo "📦 Step 1/2: Building Next.js static export..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Next.js build complete!"
echo ""

# Step 2: Sync to native projects
echo "📱 Step 2/2: Syncing to iOS and Android..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo "✅ Sync complete!"
echo ""
echo "🎉 Mobile app is ready!"
echo ""
echo "Next steps:"
echo "  • For iOS:     npm run ios:open     (requires macOS + Xcode)"
echo "  • For Android: npm run android:open (requires Android Studio)"
echo ""
echo "Or run directly:"
echo "  • npm run ios:run"
echo "  • npm run android:run"
echo ""
