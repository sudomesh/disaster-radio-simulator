#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 0faf2f3ab1322771e4c7746cdfeeea8354e05dd6
cd ../..

