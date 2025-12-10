
export interface GeneratedFile {
  path: string;
  content: string;
  type: 'node' | 'workflow' | 'config';
}

export interface BuildShipContext {
  packageJson: string | null;
  flowIdMapping: string | null;
  existingNodes: string[]; // List of existing node folder names
}

export interface RepoInfo {
  owner: string;
  name: string;
}

export interface PullRequestResult {
  url: string;
  number: number;
}

export enum AppStep {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  REVIEW = 'REVIEW',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
}

export interface PromptRequest {
  repoInfo: RepoInfo;
  userPrompt: string;
  context: BuildShipContext;
}

// GitHub API Types (Simplified)
export interface GitHubReference {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}
