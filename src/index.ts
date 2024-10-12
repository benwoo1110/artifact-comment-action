import core from '@actions/core'
import github from '@actions/github'
import { getPullRequest, GetPullRequest, ListWorkflowRunArtifacts, listWorkflowRunArtifacts, updatePullRequest } from './endpoints.js'

interface Inputs {
    githubToken: string
    repoOwner: string
    repoName: string
    runId: number
}

const inputs: Inputs = {
    githubToken: core.getInput('github_token', { required: true }),
    repoOwner: core.getInput('repo_owner',) || github.context.repo.owner,
    repoName: core.getInput('repo_name') || github.context.repo.repo,
    runId: github.context.runId
}

const octokit = github.getOctokit(inputs.githubToken)

const parsePullRequestNumber = (githubRef: string) => {
    const result = /refs\/pull\/(\d+)\/merge/g.exec(githubRef);
    if (!result) throw new Error("Reference not found.");
    const [, pullRequestId] = result;
    return parseInt(pullRequestId);
};
const prNumber: number = parsePullRequestNumber(github.context.ref);

const getPrResp: GetPullRequest["response"] = await octokit.request(getPullRequest, {
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    pull_number: prNumber,
})
const pr = getPrResp.data

const artifactsResp: ListWorkflowRunArtifacts["response"] = await octokit.request(listWorkflowRunArtifacts, {
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    run_id: inputs.runId
})

const artifacts = artifactsResp.data.artifacts
var links = ""
for (const artifact of artifacts) {
    links += artifact.archive_download_url + "\n"
}

await octokit.request(updatePullRequest, {
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    pull_number: pr.number,
    body: pr.body + `\n${links}`,
})
