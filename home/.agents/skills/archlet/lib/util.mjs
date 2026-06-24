import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const cwd = process.cwd();
export const archDir = `${cwd}/.archlet`;
export const pkgRoot = dirname(dirname(fileURLToPath(import.meta.url))); // package root (parent of lib/)
export const viewerDir = `${pkgRoot}/viewer`;

export const flag = (args, name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? true) : def;
};
