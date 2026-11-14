import * as fs from 'fs';
import * as path from 'path';

const packageLockPath = path.resolve(__dirname, '../package-lock.json');

type LockPackage = { version?: string };
type PackageLock = { packages: Record<string, LockPackage> };

const minimumVersionByMajor: Record<number, [number, number, number]> = {
  1: [1, 1, 20],
  2: [2, 1, 6],
};

const parseVersion = (version: string): [number, number, number] => {
  const [major, minor, patch] = version.split('.').map((part) => Number(part));
  return [major, minor, patch];
};

const isAtLeast = (
  version: [number, number, number],
  minimum: [number, number, number],
): boolean => {
  for (let index = 0; index < 3; index += 1) {
    if (version[index] !== minimum[index]) {
      return version[index] > minimum[index];
    }
  }
  return true;
};

test.each([
  { major: 1, minimum: '1.1.20' },
  { major: 2, minimum: '2.1.6' },
])(
  'every brace-expansion $major.x copy in package-lock.json is at least $minimum',
  ({ major }) => {
    const lock = JSON.parse(
      fs.readFileSync(packageLockPath, 'utf8'),
    ) as PackageLock;
    const copies = Object.entries(lock.packages).filter(
      ([key]) =>
        key === 'node_modules/brace-expansion' ||
        key.endsWith('/node_modules/brace-expansion'),
    );
    const copiesOfMajor = copies.filter(
      ([, pkg]) =>
        pkg.version !== undefined && parseVersion(pkg.version)[0] === major,
    );

    expect(copiesOfMajor.length).toBeGreaterThan(0);
    const minimum = minimumVersionByMajor[major];
    const below = copiesOfMajor
      .filter(([, pkg]) => !isAtLeast(parseVersion(pkg.version ?? ''), minimum))
      .map(([key, pkg]) => `${key}@${pkg.version}`);
    expect(below).toEqual([]);
  },
);
