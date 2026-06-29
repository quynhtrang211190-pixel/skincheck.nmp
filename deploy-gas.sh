#!/bin/bash
CLASP=clasp
DEPLOYMENT_ID="AKfycbxNgJMhr2DanSJhHdc8WVBcwyw11QrP3sO09W_rOaCsuhrxFl7yPzXqmduDi2wEDJSGmQ"
VERSION="${1:-latest}"

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
