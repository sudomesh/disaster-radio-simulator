#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout bc93f272ab2ee730b96bf91a4de521779f186411
cd ../
git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..

