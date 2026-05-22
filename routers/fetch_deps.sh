#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/

git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 5e12fd4802cbbaa5b6732d4347967d9eaac48199
cd ../

git clone https://github.com/sudomesh/disaster-radio
cd disaster-radio/
git checkout e8cfe8a2913b4da5391f7b2826755ffce7b7c349
cd ../

git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..
