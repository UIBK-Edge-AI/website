#!/bin/bash
# This script serves the Jekyll site locally with the correct baseurl
# to simulate GitHub Pages deployment

echo "Starting Jekyll server with baseurl '/edgeAI'..."
echo "Your site will be available at: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

echo "Cleaning previous builds and caching..."
npm run build:js
bundle exec jekyll clean
authbind bundle exec jekyll serve --host "edgeai.uibk.ac.at" -P 80