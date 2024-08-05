#!/bin/bash
zsh ./build.sh

echo ">> clearing worktree"
rm -f .git/index.lock
echo ">> worktree cleared"

echo ">> updating daily reflection"
git add .
git commit -m 'daily update'
git push -u origin
echo ">> daily reflection updated"