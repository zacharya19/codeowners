module.exports = handlePullRequestChange

const constants = require('./constants.js')
const util = require('./util.js')

async function getOwners(context) {
  const prUser = context.payload.pull_request.user.login
  const ownersMap = await util.getOwnersMap(context)

  const files = await context.github.paginate(
    context.github.pullRequests.listFiles(context.issue()), res => res.data
  )
  const reviews = await context.github.paginate(
    context.github.pullRequests.listReviews(context.issue()),
    res => res.data.filter(x => x.state === constants.APPROVED).map(x => {
      return x.user.login
    })
  )
  let owners = new Set([])
  let needReview = new Set([])
  let prUserIsOwner = true

  for (let index in files) {
    const filename = files[index].filename
    const fileOwners = util.getOwnersOfFile(ownersMap, filename)
    if (!fileOwners) { continue }

    owners = new Set([...owners, ...fileOwners])
    if (fileOwners.indexOf(prUser) > -1) {
      continue
    } else {
      prUserIsOwner = false
    }

    const intersection = fileOwners.filter(x => reviews.includes(x))
    if (intersection.length > 0) { continue }

    needReview = new Set([...needReview, ...fileOwners])
  }

  // converting set into array
  owners = [...owners]
  needReview = [...needReview]

  return { owners, needReview, prUserIsOwner }
}

async function handlePullRequestChange(app, context) {
  const pullRequest = context.payload.pull_request
  const { owners, needReview, prUserIsOwner } = await getOwners(context)
  let message = 'Codeowners approved this PR, you can merge.' // TODO: add who approved
  let checkOptions = {
    name: constants.APP_NAME,
    head_sha: pullRequest.head.sha,
    status: 'completed',
    conclusion: 'success',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    output: {
      title: 'Good to go, you can merge',
      summary: message
    }
  }

  if (needReview.length > 0) {
    message = `Blocked until ${needReview.join(', ')} will review.`
    checkOptions.conclusion = 'action_required'
    checkOptions.output.title = 'Needs codeowners to approve!'
  } else if (owners.length == 0) {
    message = 'No codeowners were found, not blocking.'
  } else if (prUserIsOwner) {
    message = 'The PR writer is the codeowner, not blocking.'
  }

  if (await util.hasStatusChange(checkOptions.conclusion, context)) {
    app.log(`Updating ${pullRequest.number} check run to ${checkOptions.conclusion}`)
    checkOptions.output.summary = message
    context.github.issues.createComment(context.issue({ body: message }))

    return context.github.checks.create(context.repo(checkOptions))
  } else {
    app.log(`No change was found in ${pullRequest.number}`)
  }
}
