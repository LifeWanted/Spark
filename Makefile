
LIB=lib
BUILD=build

SPARK=${LIB}/spark.js
JQUERY=${LIB}/jQuery-1.8.2.js
JADE=${LIB}/jade-0.27.6.js

COMPILED=${BUILD}/spark.js
COMPILED_MIN=${BUILD}/spark.min.js

LICENSE=license.txt

spark.js: ${SPARK} ${JQUERY} ${JADE}
	mkdir -p ${BUILD}
	cp ${LICENSE} ${COMPILED}
	echo "(function( window, undefined ){"  >> ${COMPILED}
	cat ${JQUERY} ${JADE} ${SPARK}          >> ${COMPILED}
	echo "})( window );"                    >> ${COMPILED}

spark.min.js: spark.js
	uglifyjs ${COMPILED} > ${COMPILED_MIN}
