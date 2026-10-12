import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.resolve(__dirname, '..');
let compiledCjsBuildDir: string;

beforeAll(() => {
  compiledCjsBuildDir = fs.mkdtempSync(
    path.join(repoRoot, 'tmp-bin-test-build-'),
  );
  execFileSync(
    'npx',
    ['tsc', '-p', 'tsconfig.cjs.json', '--outDir', compiledCjsBuildDir],
    { cwd: repoRoot },
  );
});

afterAll(() => {
  fs.rmSync(compiledCjsBuildDir, { recursive: true, force: true });
});

const runCompiledCli = (
  args: string[],
): { stdout: string; stderr: string; exitCode: number } => {
  const binPath = path.join(compiledCjsBuildDir, 'bin', 'deepmerge-yaml.js');
  try {
    const stdout = execFileSync('node', [binPath, ...args], {
      encoding: 'utf8',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const error = err as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status ?? 1,
    };
  }
};

test('--version prints the version from package.json via the commander program', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json')).toString(),
  );

  const result = runCompiledCli(['--version']);

  expect(result.exitCode).toBe(0);
  expect(result.stdout.trim()).toBe(packageJson.version);
});

test('--help prints usage built by the commander program without crashing', () => {
  const result = runCompiledCli(['--help']);

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Usage: deepmerge-yaml');
  expect(result.stdout).toContain('-o, --output');
});
