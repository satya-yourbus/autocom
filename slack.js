var Slack = require('slack-node');
var config = require('./zsconfig');
var format = require('tinytim').tim
slack = new Slack(config.slack.token);
var slackMod = function() {};
slackMod.prototype.init = function(emitter) {
	emitter.on('add', function(data) {
		slack.api('chat.postMessage', {
			text: getMessage(data),
			channel: data.branch == 'stage' ? '#stage-release' : '#prod-release',
			username: 'autocom'
		}, function(err, response) {
			if (err) {
				console.log(err);
				return;
			}
		});
	})
};

function getMessage(data) {
	if (data.branch == 'stage') {
		return format("<!channel> Code has been pushed to *stage* by {{commit.author.name}}. Full commit message below: ```{{commit.message}}```", data);
	} else if (data.branch == 'master') {
		return format("<!channel> Code has been pushed to *master* by {{commit.author.name}}. It will go live anytime soon. Full commit message below: ```{{commit.message}}```", data);
	}
	return data.commit.message;
}
module.exports = new slackMod();