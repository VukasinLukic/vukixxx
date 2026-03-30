import { execSync } from 'child_process';

const TIMEOUT = 15_000;

export function isGitRepo(folderPath: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd: folderPath, stdio: 'ignore', timeout: TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

export function gitPull(folderPath: string): string {
  try {
    const out = execSync('git pull --ff-only', { cwd: folderPath, timeout: TIMEOUT }).toString().trim();
    return out || 'Already up to date.';
  } catch (err) {
    return `pull failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export function gitCommitPush(folderPath: string, message: string): string {
  try {
    execSync('git add -A', { cwd: folderPath, timeout: TIMEOUT });
    execSync(`git commit --allow-empty -m ${JSON.stringify(message)}`, { cwd: folderPath, timeout: TIMEOUT });
    execSync('git push', { cwd: folderPath, timeout: TIMEOUT });
    return 'committed and pushed';
  } catch (err) {
    return `commit/push failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}
