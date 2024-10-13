import core from '@actions/core'
import github from '@actions/github'
import { getPullRequest, GetPullRequest, ListWorkflowRunArtifacts, listWorkflowRunArtifacts, updatePullRequest } from './endpoints.js'

interface Inputs {
    githubToken: string
    repoOwner: string
    repoName: string
    runId: string
}

const inputs: Inputs = {
    githubToken: core.getInput('github_token', { required: true }),
    repoOwner: core.getInput('repo_owner',) || github.context.repo.owner,
    repoName: core.getInput('repo_name') || github.context.repo.repo,
    runId: core.getInput('run_id') || github.context.runId.toString(),
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
const ogPRBody = pr.body ? pr.body : ""
core.info(`successfully fetched pull request ${prNumber} from ${inputs.repoOwner}/${inputs.repoName}`)

const artifactsResp: ListWorkflowRunArtifacts["response"] = await octokit.request(listWorkflowRunArtifacts, {
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    run_id: parseInt(inputs.runId),
})
const artifacts = artifactsResp.data.artifacts
core.info(`successfully fetched ${artifacts.length} artifacts for workflow ${inputs.runId}`)

const msgSeparatorStart = `\r\n\r\n<!-- artifact-comment-section ${prNumber} start (DO NOT EDIT BELOW) -->\r\n`;
const header = "----\r\n📦 Artifacts generated:\r\n"
const msgSeparatorEnd = `\r\n<!-- artifact-comment-section ${prNumber} end (DO NOT EDIT ABOVE) -->`;

let links = ""
for (const artifact of artifacts) {
    links += `- [${artifact.name}](https://nightly.link/${inputs.repoOwner}/${inputs.repoName}/actions/runs/${inputs.runId}/${artifact.name}.zip)\r\n`
}

let newBody = "";
if (ogPRBody.indexOf(msgSeparatorStart) === -1) {
    // First time updating this description
    newBody = ogPRBody + msgSeparatorStart + header + links + msgSeparatorEnd
} else {
    // Already updated this description before
    newBody = ogPRBody.slice(0, ogPRBody.indexOf(msgSeparatorStart));
    newBody = newBody + msgSeparatorStart + header + links + msgSeparatorEnd;
    // just incase someone added more text after
    newBody = newBody + ogPRBody.slice(ogPRBody.indexOf(msgSeparatorEnd) + msgSeparatorEnd.length);
}

await octokit.request(updatePullRequest, {
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    pull_number: pr.number,
    body: newBody,
})
core.info(`successfully updated pull request ${prNumber} with ${artifacts.length} artifact links!`)
