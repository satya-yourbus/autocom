var fs = require('fs');
var readline = require('readline');
var format = require('tinytim').tim
var google = require('googleapis');
var config = require('./zsconfig');
var moment = require('moment');
var googleAuth = require('google-auth-library');
var request = require('request');
var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
var TOKEN_DIR = '.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'token.json';
var RELEASE_NOTES_PATH = TOKEN_DIR + 'release_notes.json'
var CACHE_PATH = TOKEN_DIR + 'rel_notes_cache'
	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 *
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
function authorize(credentials, callback) {
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			getNewToken(oauth2Client, callback);
		} else {
			oauth2Client.credentials = JSON.parse(token);
			callback(oauth2Client);
		}
	});
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});
	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			oauth2Client.credentials = token;
			storeToken(token);
			callback(oauth2Client);
		});
	});
}
/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {
		fs.mkdirSync(TOKEN_DIR);
	} catch (err) {
		if (err.code != 'EEXIST') {
			throw err;
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	console.log('Token stored to ' + TOKEN_PATH);
}

function updateCommentInReleaseNotes(auth, data, fileId) {
	var service = google.drive('v2');
	// archive the release notes only if they are comming from master
	if (data.branch != 'master') {
		return;
	}
	fs.appendFile(CACHE_PATH, getMessage(data), function(err) {
		if (err) {
			console.log('Unable to write to cache');
			return;
		}
		fs.readFile(CACHE_PATH, 'utf-8', function(err, contents) {
			if (err) {
				// create the file, if not exists
				fs.writeFile(CACHE_PATH, '', function(err) {

				})
			}
			service.files.update({
					auth: auth,
					fileId: fileId,
					media: {
						body: contents
					}
				},
				function(err, response) {
					if (err) {
						console.log('The API returned an error: ' + err);
						return;
					}
				});
		});
	})

}

function createReleaseNotesDoc(auth, callback) {
	var service = google.drive('v2');
	service.files.insert({
		auth: auth,
		convert: true,
		resource: {
			title: 'Release Notes Document',
			mimeType: 'text/plain'
		},
		media: {
			body: 'Hello'
		}
	}, function(err, response) {
		if (err) {
			console.log('Error creating Release Notes doc');
			callback(err, auth, null);
			return;
		}
		fs.writeFile(RELEASE_NOTES_PATH, response.id);
		callback(err, auth, response.id)
	});
}

function updateComment(auth, data) {
	// Check if we have previously stored a token.
	fs.readFile(RELEASE_NOTES_PATH, function(err, fileId) {
		if (err || fileId.toString() == '') {
			console.log('creating doc');
			createReleaseNotesDoc(auth, function(err, auth, fileId) {
				if (err) {
					return;
				}
				updateCommentInReleaseNotes(auth, data, fileId)
			});
		} else {
			console.log('updating doc');
			updateCommentInReleaseNotes(auth, data, fileId.toString())
		}
	});
}
var gdrive = function() {};
gdrive.prototype.init = function(emitter) {
	emitter.on('add', function(data) {
		// Add comment to Google Drive
		// Load client secrets from a local file.
		fs.readFile('client_secret.json', function processClientSecrets(err, content) {
			if (err) {
				console.log('Error loading client secret file: ' + err);
				return;
			}
			// Authorize a client with the loaded credentials, then call the
			// Drive API.
			authorize(JSON.parse(content), function(auth) {
				updateComment(auth, data);
			});
		});
	})
};

function getIssuesFromCommit(data) {
	var cards = data.match(config.jira.issue.regex);
	if (cards) {
		return cards.join(', ').replace(/[Zz][Ss]-/g, 'https://' + config.jira.url + '/browse/ZS-');
	}
	return '';
}

function getMessage(data) {

	return "\n------------------ " + moment(data.commit.author.date).utcOffset('+0530').format('DD-MM-YYYY h:mm a') + " --------------------------------\n\n" +
		format("Author: {{commit.author.name}}\n", data) +
		"Jira Cards: " + getIssuesFromCommit(data.commit.message) +
		"\nCommit Notes:\n\n" +
		data.commit.message +
		"\n-------------------------------------------------------------------\n";
}
module.exports = new gdrive();