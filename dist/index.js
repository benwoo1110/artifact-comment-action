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
console.log(pr);
const artifactsResp = await octokit.request(listWorkflowRunArtifacts, {
  owner: inputs.repoOwner,
  repo: inputs.repoName,
  run_id: inputs.runId
});
console.log(artifactsResp.data);
const artifacts = artifactsResp.data.artifacts;
var links = "";
for (const artifact of artifacts) {
  links += artifact.archive_download_url + "\n";
}
await octokit.request(updatePullRequest, {
  owner: inputs.repoOwner,
  repo: inputs.repoName,
  pull_number: pr.number,
  body: ogPRBody + `
 HERE ARE THE LINKS:
${links}`
});
