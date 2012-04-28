#!/bin/bash

set -e

rm -rf Docs/*

./Tools/JSDoc/jsdoc -d Docs/ $(find Source/ -type f -name '*.js')

