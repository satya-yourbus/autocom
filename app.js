var commit = require('./github')
var subscribers = [require('./gdrive'), require('./slack'), require('./jira')]
var commits = new commit()
subscribers.forEach(function(s) {
	s['init'](commits)
})
commits.init();