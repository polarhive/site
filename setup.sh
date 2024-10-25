#!/bin/bash
hugo
rm -rf knowledge UE23CS /tmp/UE23CS
git clone https://github.com/polarhive/knowledge --depth=1
git clone --depth=1 https://github.com/polarhive/UE23CS /tmp/UE23CS
mv /tmp/UE23CS/src knowledge/quartz/content/uni/
mv /tmp/UE23CS/README.md knowledge/quartz/content/uni/index.md
cd knowledge/quartz || exit
npm i; npx quartz build
mv -f public ../../public/wiki
