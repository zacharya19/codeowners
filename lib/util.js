module.exports = {
  getOwnersMap, getOwnersOfFile, hasStatusChange
}
const ignore = require('ignore')
const constants = require('./constants.js')

async function getOwnersMap(context) {
  const params = context.repo({ path: constants.CODEOWNERS_FILE })
  const result = await context.github.repos.getContents(params)
  const content = Buffer.from(result.data.content, 'base64').toString()

  // TODO: filter out non real users
  return content.split('\n')
    .filter(x => x && !x.startsWith('#'))
    .map(x => {
      const line = x.trim()
      const [path, ...owners] = line.split(/\s+/)
      return { path, owners }
    })
}

function getOwnersOfFile(ownersMap, path) {
  const match = ownersMap
    .slice()
    .reverse()
    .find(x =>
      ignore()
        .add(x.path)
        .ignores(path)
    )

  if (!match) return false
  return match.owners.map(x => x.replace('@', ''))
}

async function hasStatusChange(status, context) {
  const { data: { check_runs: checkRuns } } = await context.github.checks.listForRef(context.repo({
    ref: context.payload.pull_request.head.sha,
    check_name: constants.APP_NAME
  }))
  if (checkRuns.length === 0) return true

  const [{ conclusion }] = checkRuns
  return conclusion !== status
}
