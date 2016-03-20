/* global XMLHttpRequest, JSON, moment */
function parseGithub (events, cb) {
  if (events.length === 0) {
    return cb([])
  }

  var activities = []

  var siteName = 'Github'
  var siteIcon = 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
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

  var req = new XMLHttpRequest()
  req.addEventListener('load', function () {
    parseGithub(JSON.parse(this.responseText), cb)
  })
  req.open('GET', url)
  req.send()
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
getGithub('supersam654', function (activities) {
  for (var i = 0; i < activities.length; i++) {
    allActivities.push(activities[i])
  }
  display(allActivities)
})
