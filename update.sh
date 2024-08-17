#!/bin/bash
cd /Users/spencerkingmangraham/Desktop/other/daily-reflections/

zsh ./build.sh

echo ">> clearing worktree"
rm -f .git/index.lock
echo ">> worktree cleared"

git config --global user.name "williamthazard"
git config --global user.email "105560469+williamthazard@users.noreply.github.com"

echo ">> updating daily reflection"
git add .
git commit -m 'update'
git push -u origin
echo ">> daily reflection updated"