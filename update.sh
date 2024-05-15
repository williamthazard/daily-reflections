#!/bin/bash
echo ">> updating daily reflection"

git add .
git commit -m 'daily update'
git push -u origin

echo ">> daily reflection updated"