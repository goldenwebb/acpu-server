# SPDX-License-Identifier: MIT
# Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

#echo A
#exit 0
#set -x
cd $1
git add -A .
#git commit -m 'data changed'
#git push

git_add () {
    OUTPUT=$(git add -A . 2>&1)
    if ! echo "$OUTPUT" | grep -q "Everything up-to-date"; then
        echo "$OUTPUT"
    fi
}

git_commit () {
    OUTPUT=$(git commit -m 'data changed' 2>&1)
    if ! echo "$OUTPUT" | grep -q "nothing to commit"; then
        echo "$OUTPUT"
    fi
}

#git_add
git_commit

if [ "$2" = "1" ]; then
#    git pull
    PULL_OUTPUT=$(git pull 2>&1)
    if ! echo "$PULL_OUTPUT" | grep -q "Already up to date."; then
        echo "$PULL_OUTPUT"
    fi
    OUTPUT=$(git push 2>&1)
    if ! echo "$OUTPUT" | grep -q "Everything up-to-date"; then
        echo "$OUTPUT"
    fi
#    git push 
fi
