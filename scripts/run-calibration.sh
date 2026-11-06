#!/bin/sh
# Runs the tier + style calibration plan (research/calib/plan.txt) with 3 parallel workers.
# Each line: tierA tierB gamePairs styleA styleB. Results: research/calib/games-*.jsonl
cd "$(dirname "$0")/.."
export SEED_OFF="${SEED_OFF:-0}"; cat "${1:-research/calib/plan.txt}" | xargs -P${2:-3} -L1 sh -c 'npx tsx scripts/calibrate.ts "$0" "$1" "$2" $(( $0 * 131 + $1 * 7 + ${#3} + ${SEED_OFF:-0} )) "$3" "$4" >> "research/calib/games-$0-$1-$3-$4.jsonl" 2>> research/calib/err.log'
