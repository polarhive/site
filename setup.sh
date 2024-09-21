#!/bin/bash
hugo
rm -rf knowledge
git clone https://github.com/polarhive/knowledge --depth=1
git clone https://github.com/polarhive/UE23CS --depth=1
mv UE23CS knowledge/content/uni
npm i
npx quartz build
mv -f public ../public/wiki
