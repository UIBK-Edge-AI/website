#!/bin/bash
# This script serves the Jekyll site locally with the correct baseurl
# to simulate GitHub Pages deployment

echo ""
echo "Press Ctrl+C to stop the server"
echo ""

echo "Cleaning previous builds and caching..."
npm run build:js
bundle exec jekyll clean
JEKYLL_ENV=production bundle exec jekyll serve --host 127.0.0.1 --port 8080 --baseurl "" --livereload
