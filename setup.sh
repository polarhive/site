#!/bin/bash
hugo; rm -rf knowledge UE23CS /tmp/UE23CS
git clone --depth=1 https://github.com/polarhive/knowledge
git clone --depth=1 https://github.com/polarhive/UE23CS /tmp/UE23CS
mv /tmp/UE23CS/src knowledge/wiki/content/uni/
cd knowledge/quartz || exit
npm i; npx quartz build
mv -f public ../../public/wiki
