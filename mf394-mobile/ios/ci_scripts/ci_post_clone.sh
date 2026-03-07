#!/bin/sh

set -e

# Install Node.js via Homebrew (required for Podfile to resolve Expo/RN paths)
brew install node

# Install JS dependencies
cd $CI_PRIMARY_REPOSITORY_PATH/mf394-mobile
npm install

# Install CocoaPods dependencies
cd $CI_PRIMARY_REPOSITORY_PATH/mf394-mobile/ios
pod install
