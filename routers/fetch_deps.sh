#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout bf5f8f8ac473d6847ef5b5d692cf721ef647ff2b
cd ../..

