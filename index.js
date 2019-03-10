const handlePullRequestChange = require('./lib/handle-pull-request-change')

module.exports = app => {
  // TODO: watch OWNER file changes
  app.on([
    'pull_request.opened',
    'pull_request.synchronize',
    'pull_request_review.submitted'
  ], handlePullRequestChange.bind(null, app))
}
