#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 6f6cc8b8fb2c5f22fc0dfc15c4fe96993ca3576d
cd ../
git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..

