JiraApi = require('jira').JiraApi;
var config = require('./zsconfig');
var format = require('tinytim').tim;
var jira = new JiraApi('https', config.jira.url, '443', config.jira.username, config.jira.password, '2');
var jiraMod = function() {};
jiraMod.prototype.init = function(emitter) {
	emitter.on('add', function(data) {
		var issues = getIssuesFromCommit(data.commit.message);
		if (issues == null) {
			console.log('No issues identified in the commit.');
			return;
		}
		issues.forEach(function(el) {
			addCommentToIssue(el, data);
		})
	})
};
module.exports = new jiraMod();

function addCommentToIssue(issue, data) {
	jira.addComment(issue, getCommentMessage(data), function(error, response) {
		if (error) {
			console.log(error);
			return;
		}
		console.log('response: ' + response);
	});
}

function getCommentMessage(data) {
	if (data.branch == 'stage') {
		return format("Code has been pushed to stage by {{commit.author.name}}{quote}{{commit.message}}{quote}", data);
	} else if (data.branch == 'master') {
		return format("Code has been pushed to master by {{commit.author.name}}. It will go live anytime soon.{quote}{{commit.message}}{quote}", data);
	}
	return data.commit.message;
}

function getIssuesFromCommit(data) {
	return data.match(config.jira.issue.regex);
}