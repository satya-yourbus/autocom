var Slack = require('slack-node');
var config = require('./zsconfig');
var format = require('tinytim').tim
slack = new Slack(config.slack.token);
var slackMod = function() {};
slackMod.prototype.init = function(emitter) {
	emitter.on('add', function(data) {
		slack.api('chat.postMessage', {
			text: getMessage(data),
			channel: '#prod-release',
			username: 'autocomm'
		}, function(err, response) {
			if (err) {
				console.log(err);
				return;
			}
		});
	})
};

function getMessage(data) {
	return format("```{{commit.message}}```", data);
}
module.exports = new slackMod();