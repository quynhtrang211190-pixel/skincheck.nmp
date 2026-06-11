#!/bin/bash
CLASP=clasp
DEPLOYMENT_ID="AKfycbzFYfZMXffEkLIKwBlmsJC-cS1OwgR2bQcZGJ1t89HtoICk0pOlMdGkYMgKoWF-dG4v"
VERSION="${1:-latest}"

echo "→ Pushing code..."
$CLASP push --force || exit 1

echo "→ Deploying $VERSION..."
$CLASP deploy --deploymentId "$DEPLOYMENT_ID" --description "$VERSION" || exit 1

echo "✓ Done: https://script.google.com/macros/s/$DEPLOYMENT_ID/exec"
