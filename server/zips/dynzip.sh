#!/bin/bash
orig=$1
new=$2
mkdir -p $new
cp -arn $orig $new/
cd $new
zip -rq - $orig
cd ..
rm -rf $new

