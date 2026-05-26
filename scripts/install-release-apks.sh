#!/bin/zsh
# Script to install all APKs in the android/release folder using adb

RELEASE_DIR="$(dirname "$0")/../android/app/build/outputs/apk/release"

if [ ! -d "$RELEASE_DIR" ]; then
  echo "Release directory not found: $RELEASE_DIR"
  exit 1
fi

APK_FILES=($RELEASE_DIR/*.apk)

if [ ${#APK_FILES[@]} -eq 0 ]; then
  echo "No APK files found in $RELEASE_DIR"
  exit 1
fi

for apk in "$RELEASE_DIR"/*.apk; do
  echo "Installing $apk..."
  adb install -r "$apk"
  if [ $? -eq 0 ]; then
    echo "Successfully installed $apk"
  else
    echo "Failed to install $apk"
  fi
done
