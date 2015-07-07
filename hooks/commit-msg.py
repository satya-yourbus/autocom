#!/usr/bin/env python

# Borrowed from: http://addamhardy.com/blog/2013/06/05/good-commit-messages-and-enforcing-them-with-git-hooks/
# With modifications by: Jon Roelofs <jonathan@codesourcery.com>

import sys, os
from subprocess import call
import platform
import readline
import subprocess
import re


message_file = sys.argv[1]

def is_ubuntu():
	return 'Linux' in platform.system()

editor = os.environ.get('EDITOR','vim' if is_ubuntu() else 'notepad')

def get_git_revision_hash():
    return subprocess.check_output(['git',  'rev-parse','--symbolic-full-name','--abbrev-ref', 'HEAD']).strip().decode("ascii")

def check_format_rules(lineno, line):
    real_lineno = lineno + 1
    if lineno == 0:
        if len(line) > 50:
            return "Error %d: First line should be less than 50 characters " \
                    "in length." % (real_lineno,)
    if lineno == 1:
        if line:
            return "Error %d: Second line should be empty." % (real_lineno,)
    return False

def has_jira_reference(line):
	return re.search(r'([Zz][Ss]-\d*)', line)

while True:
    commit_msg = list()
    errors = list()
    has_jira_card = False
    total_lines = 0
    branch_name = get_git_revision_hash()
    if branch_name not in ('stage','master'):
    	break
    with open(message_file) as commit_fd:
        for lineno, line in enumerate(commit_fd):
            stripped_line = line.strip()
            commit_msg.append(line)
            if not line.startswith('#'):
            	total_lines += 1
            e = check_format_rules(lineno, stripped_line)
            if has_jira_reference(line) is not None:
            	has_jira_card = True
            if e:
                errors.append(e)
    if total_lines < 3:
    	errors.append("Each commit message should have atleast 3 lines. \n#\tFirst Line: Summary \n#\tSecond Line: Empty\n#\tThird Line: Description of the commit. Write as detailed a description as possible")
    if not has_jira_card:
    	errors.append("Commit message should have reference to atleast one jira card")
    if errors:
        with open(message_file, 'w') as commit_fd:
            for line in commit_msg:
            	if not line.startswith('#'):
                	commit_fd.write(line)
            commit_fd.write('%s\n' % '# GIT COMMIT MESSAGE FORMAT ERRORS:')
            for error in errors:
                commit_fd.write('#    %s\n' % (error,))
        re_edit = raw_input('Invalid git commit message format.  Press y to edit and n to cancel the commit. [y/n]')
        if re_edit.lower() in ('n','no'):
            sys.exit(1)
        call('%s %s' % (editor, message_file), shell=True)
        continue
    break
