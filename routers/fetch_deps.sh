#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/

git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 19b70d8fcc05bc600a86d52f244ad233ebf54b58
cd ../

git clone https://github.com/sudomesh/disaster-radio
cd disaster-radio/
git checkout 7c9de62076f5cd25510c625843d556a72cb1d97e
cd ../

git clone https://github.com/bombela/backward-cpp
cd backward-cpp
git checkout v1.5
cd ../..
