#!/bin/bash
hugo
rm -rf knowledge
git clone https://github.com/polarhive/knowledge --depth=1
cd knowledge || exit
mv README.md content/index.md
npm i
npx quartz build
mv -f public ../public/wiki
