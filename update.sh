#!/bin/bash
cd /Users/spencerkingmangraham/Desktop/other/daily-reflections/

zsh ./build.sh

echo ">> clearing worktree"
rm -f .git/index.lock
echo ">> worktree cleared"

echo ">> updating daily reflection"
ssh-agent bash -c 'ssh-add /Users/spencerkingmangraham/.ssh/id_ed25519'
git config --global --add safe.directory /Users/spencerkingmangraham/Desktop/other/daily-reflections
git add .
git commit -m 'daily update'
git push -u origin
echo ">> daily reflection updated"