import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { deepmergeYaml } from '../src';

const repoRoot = path.resolve(__dirname, '..');
let compiledCjsBuildDir: string;
let tmpYamlDir: string;

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

beforeEach(() => {
  tmpYamlDir = fs.mkdtempSync(path.join(repoRoot, 'tmp-bin-test-yaml-'));
});

afterEach(() => {
  fs.rmSync(tmpYamlDir, { recursive: true, force: true });
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

test('merging two real yaml file path arguments exits 0 and prints the deep-merged content (regression: commander v13 must not reject the file-path arguments as excess)', () => {
  const aContent = 'foo:\n  bar: 1\n  baz: 2\n';
  const bContent = 'foo:\n  baz: 3\n  qux: 4\n';
  const aPath = path.join(tmpYamlDir, 'a.yaml');
  const bPath = path.join(tmpYamlDir, 'b.yaml');
  fs.writeFileSync(aPath, aContent);
  fs.writeFileSync(bPath, bContent);

  const expected = deepmergeYaml(aContent, bContent).trim();

  const result = runCompiledCli([aPath, bPath]);

  expect(result.stderr).toBe('');
  expect(result.exitCode).toBe(0);
  expect(result.stdout.trim()).toBe(expected);
});
