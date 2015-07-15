var jenkinsapi = require('jenkins-api');
var config = require('./zsconfig');
var format = require('tinytim').tim

var url = "https://" + config.jenkins.username + ":" + config.jenkins.password + "@" + config.jenkins.url;
var jenkins = jenkinsapi.init(url);
jenkins.build_info('Deploy', '1869', function(err, data) {
	if (err) {
		return console.log(err);
	}
	console.log(data.actions[0].parameters)
		// branch name
	console.log(data.actions[3].lastBuiltRevision.branch[0].name)
});