#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (C) 2012-2050 Victor Kozub <victor.space@protonmail.com>

set -euo pipefail

usage() {
    echo "usage: $0 <base> <dst> <paths...>" >&2
    echo "  copy paths under <base> into <dst>, preserving directory layout" >&2
    echo "  each arg: paths separated by ':' (like PATH), trailing ':' ok" >&2
    exit 1
}

sync_one() {
    local path="$1"
    path="${path%\\}"
    path="${path%/}"

    local rel
    if [[ "$path" == "$base"/* ]]; then
        rel="${path#$base/}"
    elif [[ "$path" == "$base" ]]; then
        rel=""
    else
        rel="${path#/}"
    fi

    local src="$base/$rel"
    if [ ! -e "$src" ]; then
        echo "skip (not found): $src" >&2
        return 0
    fi

    local target="$dst/$rel"
    if [ -d "$src" ]; then
        mkdir -p "$target"
        echo "rsync: $src/ -> $target/"
        rsync -a "$src/" "$target/"
    else
        mkdir -p "$(dirname "$target")"
        echo "rsync: $src -> $target"
        rsync -a "$src" "$target"
    fi
}

[ $# -ge 3 ] || usage

base="${1%/}"
dst="$2"
shift 2

mkdir -p "$dst"

for raw in "$@"; do
    raw="${raw%\\}"
    IFS=':' read -ra segments <<< "$raw"
    for path in "${segments[@]}"; do
        [ -n "$path" ] || continue
        sync_one "$path"
    done
done
