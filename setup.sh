#!/bin/bash
hugo
rm -rf knowledge UE23CS
git clone https://github.com/polarhive/knowledge --depth=1
git clone https://github.com/polarhive/UE23CS --depth=1 knowledge/quartz/content/uni
cd knowledge/quartz || exit
npm i
npx quartz build
mv -f public ../../public/wiki
