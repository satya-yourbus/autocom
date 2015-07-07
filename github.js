var GitHubApi = require("github"),
	Datastore = require('nedb'),
	config = require('./zsconfig'),
	EventEmitter = require('events').EventEmitter,
	util = require('util'),
	CronJob = require('cron').CronJob;
var db = new Datastore({
	filename: './github/commits.json',
	autoload: true
});
var github = new GitHubApi({
	// required
	version: "3.0.0",
	// optional
	debug: false,
	protocol: "https",
	host: "api.github.com", // should be api.github.com for GitHub
	timeout: 5000,
	headers: {
		"user-agent": "ZapStitch - AutoCom" // GitHub is happy with a unique user agent
	}
});

function Commit() {
	EventEmitter.call(this);
}
util.inherits(Commit, EventEmitter)
module.exports = Commit
Commit.prototype.add = function(data) {
	// add the commit to db
	db.insert(data, function(err, doc) {
		if (err) {
			console.log(err);
			return;
		}
	});
	// emit the add event
	this.emit('add', data);
}
Commit.prototype.init = function() {
	var _instance = this;
	// keep checking the github server every 5 mins or so for new commits;
	// for every commit that we received check if there is a record in local db and if not;
	// emit appropriate events based on new commits to stage or master branch.
	new CronJob({
		cronTime: '*/5 * * * *',
		onTick: function() {
			_instance.checkCommits('stage');
			_instance.checkCommits('master');
		},
		start: true
	})
}
Commit.prototype.handleCommits = function(commits) {
	var _instance = this;
	commits.forEach(function(commit) {
		db.find({
			sha: commit.sha,
			branch: commit.branch
		}, function(err, docs) {
			if (err) {
				console.log(err)
				return;
			}
			if (docs.length == 0) {
				_instance.add(commit);
			}
		})
	})
}
Commit.prototype.checkCommits = function(branch) {
	var _instance = this;
	github.authenticate({
		type: "basic",
		username: config.github.username,
		password: config.github.password
	});
	// TODO add pagination
	// TODO save last time invoked
	github.repos.getCommits({
		user: config.github.repo.user,
		repo: config.github.repo.name,
		sha: branch,
		since: '2015-07-08T11:00:00+05:30'
	}, function(err, res) {
		if (err) {
			console.log(err);
			return;
		}
		res.forEach(function(commit) {
			commit.branch = branch;
		});
		_instance.handleCommits(res);
	});
}