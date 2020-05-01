#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 6c7b52f7b6de15b83181e391e3cc3e5deb3f478a
cd ../
git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..

