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
git checkout 9d137b4f5f8d88131f2c0b4dd2e638cf73cfec5a
cd ../

git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..
