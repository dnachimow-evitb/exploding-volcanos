#!/usr/bin/env bash
# Adds the version tags the project uses, so they exist no matter which Claude session (or person) pushed:
#   test-v7.NN    on the commit where game-test.js first carries VERSION v7.NN      (a test build)
#   fable-v7-vNN  on the commit where game-fable-v7.js first carries VERSION v7.NN  (a live publish)
# Only commits after BASE are looked at (tags up to v7.35 were made by hand), and an existing tag is never moved.
# Run with DRY=1 to print what it would do without creating anything.
set -euo pipefail
BASE=c291ce663a4611fbfe922a0b3d322c8ffdb6670d   # "Publish v7.35 live": last commit tagged by hand
made=0
tag_file() { # $1 = file, $2 = function turning "7.36" into a tag name
  local file=$1 c v tag
  for c in $(git rev-list --reverse --first-parent "$BASE..HEAD" -- "$file"); do
    v=$(git show "$c:$file" | sed -n "s/^const VERSION='v\([0-9][0-9.]*\)'.*/\1/p" | head -1)
    [ -n "$v" ] || continue
    tag=$($2 "$v")
    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then continue; fi
    echo "tag $tag -> $(git log -1 --format='%h %s' "$c")"
    if [ -z "${DRY:-}" ]; then git tag "$tag" "$c"; git push origin "refs/tags/$tag"; else git tag "$tag" "$c"; DRYTAGS="${DRYTAGS:-} $tag"; fi
    made=$((made+1))
  done
}
test_tag() { echo "test-v$1"; }
live_tag() { echo "fable-v7-v${1#*.}"; }
tag_file game-test.js test_tag
tag_file game-fable-v7.js live_tag
if [ -n "${DRY:-}" ]; then for t in ${DRYTAGS:-}; do git tag -d "$t" >/dev/null; done; fi
echo "done: $made new tag(s)"
