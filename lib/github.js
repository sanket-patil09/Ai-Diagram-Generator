import axios from 'axios';

export function parseGithubUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace('.git', '') };
  } catch (e) {
    return null;
  }
}

export async function fetchRepoContext(owner, repo) {
  try {
    const headers = process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {};
    const axiosConfig = { headers, timeout: 10000 };

    // 1. Get default branch
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, axiosConfig);
    const defaultBranch = repoRes.data.default_branch;
    const language = repoRes.data.language;
    const description = repoRes.data.description;

    // 2. Fetch repo tree
    const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, axiosConfig);
    
    // 3. Filter tree slightly to reduce token count
    let paths = treeRes.data.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path);

    // Filter out typical ignore directories
    paths = paths.filter(path => {
      const p = path.toLowerCase();
      if (p.includes('node_modules') || p.includes('dist/') || p.includes('build/') || p.includes('.git')) {
        return false;
      }
      return true;
    });

    // 4. Try to fetch specific important files if they exist (Prisma schemas, Package.json, Dockerfile)
    // We only take the top 5 important files to avoid rate limits
    const importantPaths = paths.filter(path => {
      const p = path.toLowerCase();
      return p.includes('schema.prisma') || p.includes('docker-compose') || p.includes('package.json');
    }).slice(0, 3);

    // Fetch files concurrently to drastically improve speed
    const vitalFilesPromises = importantPaths.map(async (p) => {
      try {
        const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${p}`, axiosConfig);
        return `\n--- File: ${p} ---\n${typeof rawRes.data === 'string' ? rawRes.data : JSON.stringify(rawRes.data).substring(0, 2000)}`;
      } catch (err) {
        console.warn(`Failed to fetch raw file ${p}`);
        return null;
      }
    });

    const vitalFilesResults = await Promise.all(vitalFilesPromises);
    const vitalFilesContent = vitalFilesResults.filter(Boolean);

    // Limit paths list if it's too massive
    if (paths.length > 300) {
      paths = paths.slice(0, 300);
      paths.push("... (truncated)");
    }

    return {
      description,
      language,
      paths: paths.join('\n'),
      vitalFiles: vitalFilesContent.join('\n')
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error("Github API Timeout:", error.message);
      throw new Error('Timeout: GitHub took too long to respond. The repository might be extremely large, or your connection is unstable.');
    }
    if (error.response && error.response.status === 403) {
      console.error("Github API Rate limit hit!");
      throw new Error('API Rate Limit Exceeded: GitHub blocked the request. Please add a GITHUB_TOKEN to your .env.local file to raise limits from 60 to 5,000 per hour.');
    }
    console.error("Github parsing error", error.message || error);
    throw new Error('Failed to analyze GitHub repository. Please ensure the repository is public and accessible.');
  }
}
