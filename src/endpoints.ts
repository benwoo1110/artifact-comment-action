import { Endpoints } from '@octokit/types'

export const listAssociatedPullRequests = 'GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls' as const
export const updatePullRequest = 'PATCH /repos/{owner}/{repo}/pulls/{pull_number}' as const

export type ListAssociatedPullRequests = Endpoints[typeof listAssociatedPullRequests]
export type UpdatePullRequest = Endpoints[typeof updatePullRequest]
