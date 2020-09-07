#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/

git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 72c67c3c7fcc23dbcb6daf6d6e6ef1ed2372f430
cd ../

git clone https://github.com/sudomesh/disaster-radio
cd disaster-radio/
git checkout c4d93a9fd3e7f45a3c2c1e56b542fa79401cf022
cd ../

git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..
