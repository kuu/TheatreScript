#!/bin/bash

set -e

#COMPILATION_LEVEL=ADVANCED_OPTIMIZATIONS
COMPILATION_LEVEL=SIMPLE_OPTIMIZATIONS
OUTPUT_FILE='Build/TheatreScript.min.js'
SRCS=''
DFLAGS=''

for i in $(find ./Source/ -type f -name '*.js' -not -name 'Theatre.js') ; do
	SRCS="$SRCS --js $i"
done

if [ -f 'debug_flags' ] ; then
	for i in $(cat 'debug_flags'); do
		DFLAGS="$DFLAGS -D $i"
	done
fi

java \
	-jar Tools/Closure/compiler.jar \
	--compilation_level $COMPILATION_LEVEL \
	--js_output_file "$OUTPUT_FILE" \
	--language_in ECMASCRIPT5_STRICT \
    --output_wrapper '%output%;theatre.init();' \
	--generate_exports \
	$DFLAGS \
    --js Source/Theatre.js \
	$SRCS

