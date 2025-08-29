#!/bin/bash
# This script serves the Jekyll site locally with the correct baseurl
# to simulate GitHub Pages deployment

echo "Starting Jekyll server with baseurl '/edgeAI'..."
echo "Your site will be available at: http://localhost:4000/website/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

echo "Cleaning previous builds and caching..."
npm run build:js
bundle exec jekyll clean
# Get IP of specific interface (e.g., eth0, ens3, etc.)
IP=$(ip route get 1 | awk '{print $7}' | head -1)
bundle exec jekyll serve --baseurl '/website' --host $IP -P 4000

