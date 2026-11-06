#!/bin/sh
# Runs the tier calibration plan with 3 parallel workers. Results: research/calib/games-A-B.jsonl
cd "$(dirname "$0")/.."
cat research/calib/plan.txt | xargs -P3 -L1 sh -c 'npx tsx scripts/calibrate.ts "$0" "$1" "$2" $(( $0 * 131 + $1 * 7 )) >> "research/calib/games-$0-$1.jsonl" 2>> research/calib/err.log'
