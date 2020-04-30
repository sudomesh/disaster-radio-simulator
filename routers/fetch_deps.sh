#!/bin/bash

set -e

rm -rf libs

mkdir -p libs
cd libs/
git clone https://github.com/sudomesh/LoRaLayer2
cd LoRaLayer2/
git checkout 010d37251c18160eb1334e35c753eb92e0d22def
cd ../..

