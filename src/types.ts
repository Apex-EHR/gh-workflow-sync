export interface RepoStatus {
  repo: string
  branches: BranchStatus[]
  needsWorkflow: boolean
  lastCommitDate?: string
}

export interface BranchStatus {
  branch: string
  status: 'present' | 'missing' | 'not-found'
}

export interface CLIOptions {
  dryRun: boolean
  workflowFile?: string
  ghHost: string
  verbose: boolean
  interactive: boolean
  noSort: boolean
}

export interface PRResult {
  repo: string
  branch: string
  success: boolean
  prNumber?: number
  error?: string
}
