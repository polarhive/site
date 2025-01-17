#!/bin/bash
hugo; rm -rf knowledge UE23CS /tmp/UE23CS /tmp/ideas
curl -L -o public/assets/résumé.pdf https://raw.githubusercontent.com/polarhive/resume/refs/heads/main/r%C3%A9sum%C3%A9.pdf
git clone --depth=1 https://codeberg.org/polarhive/knowledge
git clone --depth=1 https://codeberg.org/polarhive/UE23CS /tmp/UE23CS
git clone --depth=1 https://codeberg.org/polarhive/ideas /tmp/ideas
mv /tmp/ideas knowledge/wiki/content/ideas/
mv /tmp/UE23CS/src knowledge/wiki/content/uni/
cd knowledge/wiki || exit
npm i; npx quartz build
mv -f public ../../public/wiki
