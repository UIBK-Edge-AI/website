#!/bin/bash
# This script serves the Jekyll site locally with the correct baseurl
# to simulate GitHub Pages deployment

echo "Starting Jekyll server with baseurl '/edgeAI'..."
echo "Your site will be available at: http://localhost:4000/edgeAI/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

bundle exec jekyll serve --baseurl '/edgeAI'