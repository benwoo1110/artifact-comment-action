import { Endpoints } from '@octokit/types'

export const getPullRequest = 'GET /repos/{owner}/{repo}/pulls/{pull_number}' as const
export const updatePullRequest = 'PATCH /repos/{owner}/{repo}/pulls/{pull_number}' as const
export const listWorkflowRunArtifacts = 'GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts' as const

export type GetPullRequest = Endpoints[typeof getPullRequest]
export type UpdatePullRequest = Endpoints[typeof updatePullRequest]
export type ListWorkflowRunArtifacts = Endpoints[typeof listWorkflowRunArtifacts]
