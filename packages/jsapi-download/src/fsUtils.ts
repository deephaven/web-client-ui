import fs from 'node:fs';
import path from 'node:path';

/**
 * Create directories if they do not exist.
 * @param dirPaths The paths of the directories to create.
 */
export function ensureDirectoriesExist(dirPaths: string[]): void {
  dirPaths.forEach(dirPath => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * Get download paths for a list of server paths.
 * @param targetDir The directory to download the files to.
 * @param serverPaths The paths of the files on the server.
 * @returns The paths to download the files to.
 */
export function getDownloadPaths(
  targetDir: string,
  serverPaths: string[]
): string[] {
  return serverPaths.map(filePath =>
    path.join(targetDir, path.basename(filePath))
  );
}
