#!/bin/bash
# Commit and push reports for Vercel deployment
set -e

git add data/reports/
if git diff --cached --quiet; then
  echo "No new reports to commit"
  exit 0
fi
git commit -m "update reports $(date +%Y-%m-%d)"
git push
