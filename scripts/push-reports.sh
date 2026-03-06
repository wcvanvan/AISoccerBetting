#!/bin/bash
# Commit and push reports for Vercel deployment
set -e

git add data/reports/
git commit -m "update reports $(date +%Y-%m-%d)" || echo "No new reports to commit"
git push
