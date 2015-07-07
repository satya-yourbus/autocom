#!/usr/bin/env python

# Borrowed from: http://addamhardy.com/blog/2013/06/05/good-commit-messages-and-enforcing-them-with-git-hooks/
# With modifications by: Jon Roelofs <jonathan@codesourcery.com>

import sys, os
from subprocess import call
import platform
import subprocess

def is_ubuntu():
	return 'Linux' in platform.system()

def subprocess_cmd(command):
    process = subprocess.Popen(command,stdout=subprocess.PIPE, shell=True)
    proc_stdout = process.communicate()[0].strip()
    print proc_stdout

def get_git_revision_hash():
    return subprocess.check_output(['git',  'rev-parse','--symbolic-full-name','--abbrev-ref', 'HEAD']).strip().decode("ascii")

branch_name = get_git_revision_hash()
script = ['.git/hooks/post-merge-script.sh'] if is_ubuntu() else ['post-merge-script.bat']
if branch_name == 'stage':
	subprocess.call(script)
