import core from '@actions/core'
import github from '@actions/github'
import { listAssociatedPullRequests, ListAssociatedPullRequests, updatePullRequest } from './endpoints.js'
import { exit } from 'process'

interface Inputs {
    githubToken: string
    repoOwner: string
    repoName: string
}

const inputs: Inputs = {
    githubToken: core.getInput('github_token', { required: true }),
    repoOwner: core.getInput('repo_owner',),
    repoName: core.getInput('repo_name'),
}

const octokit = github.getOctokit(inputs.githubToken)

const owner = inputs.repoOwner === '' ? github.context.repo.owner : inputs.repoOwner
const repo = inputs.repoName === '' ? github.context.repo.repo : inputs.repoName
const runId = github.context.runId //todo customizable option


const associatedPrs: ListAssociatedPullRequests["response"] = await octokit.request(listAssociatedPullRequests, {
    owner,
    repo,
    commit_sha: github.context.sha,
})

if (associatedPrs.data.length === 0) {
    core.error('No PRs associated with this commit.')
    exit(0)
}

const pr = associatedPrs.data[0]

const link = `https://nightly.link/${inputs.repoOwner}/${inputs.repoName}/actions/runs/${runId}/multiverse-core-pr${pr.number}.zip`
console.log(link)

await octokit.request(updatePullRequest, {
    owner,
    repo,
    pull_number: pr.number,
    body: pr.body + `\n\n${link}`,
})
