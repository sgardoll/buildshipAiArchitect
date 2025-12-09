import { GeneratedFile, RepoInfo, PullRequestResult } from '../types';

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private get headers() {
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  // Parse "https://github.com/owner/repo" to { owner, name }
  static parseRepoUrl(url: string): RepoInfo | null {
    try {
      const cleanUrl = url.replace(/\/$/, '');
      const parts = cleanUrl.split('/');
      if (parts.length < 2) return null;
      return {
        name: parts[parts.length - 1],
        owner: parts[parts.length - 2],
      };
    } catch (e) {
      return null;
    }
  }

  private async handleError(res: Response, phase: string): Promise<never> {
    let details = '';
    try {
      const json = await res.json();
      details = json.message || JSON.stringify(json);
      if (json.errors) details += ` - ${JSON.stringify(json.errors)}`;
    } catch {
      details = res.statusText;
    }
    throw new Error(`${phase} failed: ${details}`);
  }

  async checkRepoAccess(repo: RepoInfo): Promise<boolean> {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
        headers: this.headers,
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async getFileContent(repo: RepoInfo, path: string): Promise<string | null> {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/contents/${path}`, {
        headers: this.headers,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return atob(data.content);
    } catch (e) {
      return null;
    }
  }

  async createPullRequest(
    repo: RepoInfo,
    files: GeneratedFile[],
    title: string,
    body: string
  ): Promise<PullRequestResult> {
    const baseUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}`;
    
    // 0. Get Default Branch (handles main vs master)
    const repoRes = await fetch(baseUrl, { headers: this.headers });
    if (!repoRes.ok) await this.handleError(repoRes, 'Fetch Repo Info');
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // Generate descriptive branch name from title
    // e.g., "BuildShip AI: Create PDF Node..." -> "ai-buildship/create-pdf-node-123456"
    const slug = title
      .toLowerCase()
      .replace(/^buildship ai:?\s*/, '') // Remove prefix
      .replace(/[^a-z0-9]+/g, '-')      // Replace symbols with hyphen
      .replace(/^-+|-+$/g, '')          // Trim hyphens
      .slice(0, 50);                    // Truncate length

    const timestamp = Date.now().toString().slice(-6);
    const branchName = `ai-buildship/${slug || 'update'}-${timestamp}`;

    // 1. Get reference to default branch
    const refRes = await fetch(`${baseUrl}/git/ref/heads/${defaultBranch}`, { headers: this.headers });
    if (!refRes.ok) await this.handleError(refRes, `Get ref ${defaultBranch}`);
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 2. Create a new branch
    const createBranchRes = await fetch(`${baseUrl}/git/refs`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });
    if (!createBranchRes.ok) await this.handleError(createBranchRes, 'Create Branch');

    // 3. Create Blobs for each file
    const treeItems = [];
    for (const file of files) {
      const blobRes = await fetch(`${baseUrl}/git/blobs`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      });
      if (!blobRes.ok) await this.handleError(blobRes, `Create Blob (${file.path})`);
      const blobData = await blobRes.json();
      treeItems.push({
        path: file.path,
        mode: '100644', // file mode
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // 4. Create Tree
    const treeRes = await fetch(`${baseUrl}/git/trees`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        base_tree: baseSha,
        tree: treeItems,
      }),
    });
    if (!treeRes.ok) await this.handleError(treeRes, 'Create Tree');
    const treeData = await treeRes.json();

    // 5. Create Commit
    const commitRes = await fetch(`${baseUrl}/git/commits`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        message: title,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });
    if (!commitRes.ok) await this.handleError(commitRes, 'Create Commit');
    const commitData = await commitRes.json();

    // 6. Update Branch Reference
    const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branchName}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    });
    if (!updateRefRes.ok) await this.handleError(updateRefRes, 'Update Branch Ref');

    // 7. Create PR
    const prRes = await fetch(`${baseUrl}/pulls`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        title,
        body,
        head: branchName,
        base: defaultBranch,
      }),
    });

    if (!prRes.ok) await this.handleError(prRes, 'Create PR');
    const prData = await prRes.json();

    return {
      url: prData.html_url,
      number: prData.number,
    };
  }
}