#!/bin/sh
sudo apt-get install vim
export EDITOR=vim
cd ~
git clone https://github.com/satya-yourbus/autocom.git
cd -
rm -rf .git/hooks
ln -sf ~/autocom/hooks .git/hooks
git config --global commit.template ~/autocom/hooks/git-commit-template.txt
git config --global core.editor vim