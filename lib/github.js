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
    // 1. Get default branch
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const defaultBranch = repoRes.data.default_branch;
    const language = repoRes.data.language;
    const description = repoRes.data.description;

    // 2. Fetch repo tree
    const treeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    
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
        const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${p}`);
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
    console.error("Github parsing error", error);
    throw new Error('Failed to analyze GitHub repository. Please ensure the repository is public and accessible.');
  }
}
