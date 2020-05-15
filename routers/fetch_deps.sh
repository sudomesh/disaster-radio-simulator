#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 1f488a9a6d0fb865018c3f316b0f23e12ed0bf42
cd ../
git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..

