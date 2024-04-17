#!/bin/bash
hugo
rm -rf knowledge
git clone https://github.com/polarhive/knowledge --depth=1; cd knowledge || exit
curl -L https://github.com/acmpesuecc/anna/releases/download/v2.0.0/anna_Linux_x86_64.tar.gz > anna_Linux_x86.tar.gz; tar -xvzf anna_Linux_x86.tar.gz; 
./anna
mv -f site/rendered/static ../public/static
mv -f site/rendered/wiki ../public/wiki
