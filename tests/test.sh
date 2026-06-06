#!/bin/bash
set -uo pipefail

# Install verifier dependencies from preloaded wheels only. No network is used.
python -m pip install --no-index --find-links /tests/wheels \
  pytest==8.4.1 pytest-json-ctrf==0.3.5 >/tmp/verifier-pip-install.log 2>&1
PIP_RC=$?
if [ "$PIP_RC" -ne 0 ]; then
    cat /tmp/verifier-pip-install.log
    mkdir -p /logs/verifier
    echo 0 > /logs/verifier/reward.txt
    exit 0
fi

mkdir -p /logs/verifier

# Check if we're in a valid working directory
if [ "$PWD" = "/" ]; then
    echo "Error: No working directory set. Please set a WORKDIR in your Dockerfile before running this script."
    echo 0 > /logs/verifier/reward.txt
    exit 0
fi

# Run tests
python -m pytest -o cache_dir=/tmp/pytest_cache \
  --ctrf /logs/verifier/ctrf.json /tests/test_outputs.py -rA
rc=$?

if [ "$rc" -eq 0 ]; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
fi
