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
  var siteIcon = '<i class="fa fa-github-alt"></i>'
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
  var siteIcon = '<i class="fa fa-reddit-alien"></i>'
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
    '  <p>' + activity.content + ' ' + activity.date.fromNow() + '</p>' +
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

var username = 'supersam654'

getGithub(username, addActivities)
getReddit(username, addActivities)
