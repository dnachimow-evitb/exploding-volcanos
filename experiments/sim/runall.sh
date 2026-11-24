#!/bin/bash
# every mode and persona, N sessions each, four at a time; logs land in botlogs/
N=${1:-10}; cd "$(dirname "$0")"
jobs_list="max:kid max:casual max:good smart-push:kid smart-push:casual smart-push:good smart-swipe:kid smart-swipe:casual smart-swipe:good smart-swipe:derekish noah-push:kid noah-push:casual noah-push:good noah-swipe:kid noah-swipe:casual noah-swipe:good"
for j in $jobs_list; do m=${j%%:*}; w=${j##*:}; (timeout 900 node playtest.js $m $w $N > botlogs/$m-$w.txt 2> botlogs/$m-$w.err) & while [ $(jobs -r | wc -l) -ge 4 ]; do wait -n; done; done; wait; echo done; wc -l botlogs/*.txt | tail -20
