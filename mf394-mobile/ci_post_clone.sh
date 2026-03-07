#!/bin/sh

set -e

cd $CI_PRIMARY_REPOSITORY_PATH/mf394-mobile/ios

# Install CocoaPods dependencies
pod install

Make it executable:
chmod +x ios/ci_scripts/ci_post_clone.sh

Xcode Cloud automatically runs ci_post_clone.sh after cloning your repo, before the build starts.