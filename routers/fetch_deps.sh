#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout e8b5c4b8b8e675d9781c7673f25f49a1e653a4be
cd ../..

