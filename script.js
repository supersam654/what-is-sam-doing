/* global XMLHttpRequest, moment */
function getUrl (url, cb) {
  var req = new XMLHttpRequest()
  req.addEventListener('load', cb)
  req.open('GET', url)
  req.send()
}

// http://stackoverflow.com/a/12034334
var escapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
}

// HTML encode a string.
// Aweful name to make some bad lines a tad shorter.
function e (string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return escapes[s]
  })
}

// Aweful name to make some bad lines a tad shorter.
var u = encodeURI

function parseGithub (events, cb) {
  if (events.length === 0) {
    return cb([])
  }

  var activities = []

  var siteName = 'Github'
  var siteIcon = '<i class="fa fa-4x fa-github-alt"></i>'
  var usernameLink = '<a href="' + e(u(events[0].actor.url)) + '">' + e(events[0].actor.login) + '</a>'
  for (var i = 0; i < events.length; i++) {
    var event = events[i]
    var repoLink = '<a href="' + e(u(event.repo.url)) + '">' + e(event.repo.name) + '</a>'
    var branchLink = '<a href="' + e(u(event.repo.url + '/tree/' + event.payload.ref)) + '">' + e(event.payload.ref) + '</a>'
    var content = usernameLink

    if (event.type === 'DeleteEvent') {
      content += ' deleted the ' + e(event.payload.ref_type) + ' <code>' + e(event.payload.ref) + '</code> at ' + repoLink
    } else if (event.type === 'CreateEvent') {
      if (event.payload.ref_type === 'repository') {
        content += ' created the repository ' + repoLink
      } else {
        content += ' created the ' + e(event.payload.ref_type) + ' <code>' + branchLink + '</code> at ' + repoLink
      }
    } else if (event.type === 'IssueCommentEvent') {
      var issueLink = '<a href="' + e(u(event.payload.comment.html_url)) + '">' + e(event.payload.issue.title) + '</a> at ' + repoLink
      content = usernameLink + ' commented on the issue ' + issueLink + ' with <i>' + e(event.payload.comment.body) + '</i>'
    } else if (event.type === 'PushEvent') {
      content = usernameLink + ' pushed to ' + branchLink + ' at ' + repoLink
    } else {
      console.log('Unknown Github event.')
      console.log(event)
      content = usernameLink + ' did an unknown thingy on Github.'
    }

    var activity = {
      siteName: siteName,
      siteIcon: siteIcon,
      date: moment(event.created_at),
      content: content
    }

    activities.push(activity)
  }

  cb(activities)
}

function getGithub (username, cb) {
  var url = 'https://api.github.com/users/' + u(username) + '/events'

  getUrl(url, function () {
    parseGithub(JSON.parse(this.responseText), cb)
  })
}

function parseReddit (events, cb) {
  if (events.length === 0) {
    return cb([])
  }

  var activities = []

  var siteName = 'reddit'
  var siteIcon = '<i class="fa fa-4x fa-reddit-alien"></i>'
  var username = events.data.children[0].data.author
  var usernameLink = '<a href="https://www.reddit.com/user/' + username + '">' + username + '</a>'

  for (var i = 0; i < events.data.children.length; i++) {
    var kind = events.data.children[i].kind
    var event = events.data.children[i].data

    var subredditLink = '<a href=https://www.reddit.com/r/"' + event.subreddit + '/">/r/' + event.subreddit + '</a>'

    var content, postTitleLink
    if (kind === 't3') {
      // Post
      postTitleLink = '<h3><a href="' + event.url + '">' + event.title + '</a></h3>'
      console.log(postTitleLink)
      content = usernameLink + ' posted ' + postTitleLink + ' in ' + subredditLink
    } else if (kind === 't1') {
      // Comment
      postTitleLink = '<h4><a href="' + event.link_url + '">' + event.link_title + '</a></h4>'
      var comment = event.body
      content = usernameLink + ' commented on ' + postTitleLink + ' with <i>' + comment + '</i> in ' + subredditLink
    } else {
      console.log('Unknown reddit event.')
      console.log(event)
      content = usernameLink + ' did an unknown thingy on reddit.'
    }

    var activity = {
      siteName: siteName,
      siteIcon: siteIcon,
      date: moment.unix(event.created_utc),
      content: content
    }

    activities.push(activity)
  }

  cb(activities)
}

function getReddit (username, cb) {
  var url = 'https://api.reddit.com/user/' + username + '/overview'

  getUrl(url, function () {
    parseReddit(JSON.parse(this.responseText), cb)
  })
}

function sort (activities) {
  activities.sort(function (a, b) {
    return a.date < b.date
  })
}

function parseActivity (activity) {
  return '' +
    '<div class="col-md-12">' +
    '  <div class="panel panel-default">' +
    '    <div class="panel-body">' +
    '      <div class="col-md-1">' +
    '        <h2>' + activity.siteName + '</h2>' +
    '        <span class="hidden-xs">' + activity.siteIcon + '</span>' +
    '      </div>' +
    '      <div class="col-md-11">' +
    '        <p>' + activity.content + ' <span class="text-muted">' + activity.date.fromNow() + '</span></p>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>'
}

function display (activities) {
  sort(activities)

  var html = ''
  for (var i = 0; i < activities.length; i++) {
    html += parseActivity(activities[i])
  }
  document.getElementById('content').innerHTML = html
}

var allActivities = []
function addActivities (activities) {
  for (var i = 0; i < activities.length; i++) {
    allActivities.push(activities[i])
  }
  display(allActivities)
}

var services = {
  'github': getGithub,
  'reddit': getReddit
}

function printError () {
  console.log('Could not find requested user.')
}

function getKeybase (username) {
  var url = 'https://keybase.io/_/api/1.0/user/lookup.json?username=' + username

  getUrl(url, function () {
    var data = JSON.parse(this.responseText)

    if (data.status.code !== 0) {
      printError()
      return
    }

    var profiles = data.them.proofs_summary.all
    for (var i = 0; i < profiles.length; i++) {
      var profile = profiles[i]
      var username = profile.nametag
      var service = profile.proof_type

      var getData = services[service] || function () {}
      getData(username, addActivities)
    }
  })
}

getKeybase('supersam654')
