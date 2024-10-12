"use strict";
import core from "@actions/core";
import github from "@actions/github";
import { getPullRequest, listWorkflowRunArtifacts, updatePullRequest } from "./endpoints.js";
const inputs = {
  githubToken: core.getInput("github_token", { required: true }),
  repoOwner: core.getInput("repo_owner") || github.context.repo.owner,
  repoName: core.getInput("repo_name") || github.context.repo.repo,
  runId: github.context.runId
};
const octokit = github.getOctokit(inputs.githubToken);
const parsePullRequestNumber = (githubRef) => {
  const result = /refs\/pull\/(\d+)\/merge/g.exec(githubRef);
  if (!result) throw new Error("Reference not found.");
  const [, pullRequestId] = result;
  return parseInt(pullRequestId);
};
const prNumber = parsePullRequestNumber(github.context.ref);
const getPrResp = await octokit.request(getPullRequest, {
  owner: inputs.repoOwner,
  repo: inputs.repoName,
  pull_number: prNumber
});
const pr = getPrResp.data;
const ogPRBody = pr.body ? pr.body : "";
core.info(`successfully fetched pull request ${prNumber} from ${inputs.repoOwner}/${inputs.repoName}`);
const artifactsResp = await octokit.request(listWorkflowRunArtifacts, {
  owner: inputs.repoOwner,
  repo: inputs.repoName,
  run_id: inputs.runId
});
const artifacts = artifactsResp.data.artifacts;
core.info(`successfully fetched ${artifacts.length} artifacts for workflow ${inputs.runId}`);
var links = "";
for (const artifact of artifacts) {
  links += `- [${artifact.name}](https://nightly.link/${inputs.repoOwner}/${inputs.repoName}/actions/runs/${inputs.runId}/${artifact.name}.zip)\r
`;
}
const msgSeparatorStart = `\r
\r
<!-- artifact-comment-section ${prNumber} start (DO NOT EDIT BELOW) -->\r
`;
const title = "----\r\n\u{1F4E6} Artifacts generated:\r\n";
const msgSeparatorEnd = `\r
<!-- artifact-comment-section ${prNumber} end (DO NOT EDIT ABOVE) -->`;
var newBody = "";
if (ogPRBody.indexOf(msgSeparatorStart) === -1) {
  newBody = ogPRBody + msgSeparatorStart + title + links + msgSeparatorEnd;
} else {
  newBody = ogPRBody.slice(0, ogPRBody.indexOf(msgSeparatorStart));
  newBody = newBody + msgSeparatorStart + title + links + msgSeparatorEnd;
  newBody = newBody + ogPRBody.slice(ogPRBody.indexOf(msgSeparatorEnd) + msgSeparatorEnd.length);
}
await octokit.request(updatePullRequest, {
  owner: inputs.repoOwner,
  repo: inputs.repoName,
  pull_number: pr.number,
  body: newBody
});
core.info(`successfully updated pull request ${prNumber} with ${artifacts.length} artifact links!`);
