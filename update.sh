#!/bin/bash
cd /Users/spencerkingmangraham/Desktop/other/daily-reflections/

zsh ./build.sh

# su spencerkingmangraham

echo ">> clearing worktree"
rm -f .git/index.lock
echo ">> worktree cleared"

echo ">> updating daily reflection"
git add .
git commit -m 'update'
git push -u origin
echo ">> daily reflection updated"