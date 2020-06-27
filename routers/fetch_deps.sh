#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/

git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 5fc98c99706b7883b49ece82d9a7abc1b35e0bae
cd ../

git clone https://github.com/sudomesh/disaster-radio
cd disaster-radio/
git checkout 43075131149f1456c2364c3cf8fbb5121cefae65
cd ../

git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..
