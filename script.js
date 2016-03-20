/* global XMLHttpRequest, JSON, moment */
function getUrl (url, cb) {
  var req = new XMLHttpRequest()
  req.addEventListener('load', cb)
  req.open('GET', url)
  req.send()
}

function parseGithub (events, cb) {
  if (events.length === 0) {
    return cb([])
  }

  var activities = []

  var siteName = 'Github'
  var siteIcon = '<i class="fa fa-4x fa-github-alt"></i>'
  var username = events[0].actor.login
  for (var i = 0; i < events.length; i++) {
    var event = events[i]
    var activity = {
      siteName: siteName,
      siteIcon: siteIcon,
      date: moment(event.created_at),
      content: username + ' made a ' + event.type
    }

    activities.push(activity)
  }

  cb(activities)
}

function getGithub (username, cb) {
  var url = 'https://api.github.com/users/' + username + '/events'

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

  for (var i = 0; i < events.data.children.length; i++) {
    var event = events.data.children[i]

    var activity = {
      siteName: siteName,
      siteIcon: siteIcon,
      date: moment.unix(event.data.created_utc),
      content: username + ' posted in ' + event.data.subreddit
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
    '        <p>' + activity.content + ' ' + activity.date.fromNow() + '</p>' +
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

services = {
  'github': getGithub,
  'reddit': getReddit
}

function printError () {
  console.log('Could not find requested user.')
}

function getKeybase (username) {
  url = 'https://keybase.io/_/api/1.0/user/lookup.json?username=' + username

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
