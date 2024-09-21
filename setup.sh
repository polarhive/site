#!/bin/bash
hugo
rm -rf knowledge UE23CS
git clone https://github.com/polarhive/knowledge --depth=1
git clone https://github.com/polarhive/UE23CS --depth=1 knowledge/content/uni
cd knowledge/quartz || exit
mv ../content .
npm i
npx quartz build
mv -f public ../../public/wiki
