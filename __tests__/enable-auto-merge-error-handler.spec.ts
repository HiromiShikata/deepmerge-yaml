import { execSync } from 'child_process';
import * as path from 'path';

const scriptPath = path.resolve(
  __dirname,
  '../scripts/enable-auto-merge-error-handler.sh',
);

const runScript = (input: string): { stdout: string; exitCode: number } => {
  try {
    const stdout = execSync(`bash "${scriptPath}"`, {
      input,
      encoding: 'utf8',
    });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; status?: number };
    return { stdout: error.stdout || '', exitCode: error.status || 1 };
  }
};

test('exits 0 when response has no errors field', () => {
  const result = runScript(
    '{"data":{"enablePullRequestAutoMerge":{"clientMutationId":null}}}',
  );
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Auto merge enabled successfully');
});

test('exits 0 with warning for unstable PR status', () => {
  const input = JSON.stringify({
    data: null,
    errors: [{ type: 'UNPROCESSABLE', message: 'Pull request is in unstable status' }],
  });
  const result = runScript(input);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Warning');
});

test('exits 0 with warning for protected branch error (protected before branch)', () => {
  const input = JSON.stringify({
    data: null,
    errors: [
      {
        type: 'UNPROCESSABLE',
        message: 'Protected branch requires a review before merging',
      },
    ],
  });
  const result = runScript(input);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Warning');
});

test('exits 0 with warning for protected branch error (required before protected)', () => {
  const input = JSON.stringify({
    data: null,
    errors: [
      {
        type: 'UNPROCESSABLE',
        message: 'Pull request required protected branch settings',
      },
    ],
  });
  const result = runScript(input);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Warning');
});

test('exits 1 for unknown error message', () => {
  const input = JSON.stringify({
    data: null,
    errors: [{ type: 'UNKNOWN_ERROR', message: 'Something went wrong unexpectedly' }],
  });
  const result = runScript(input);
  expect(result.exitCode).toBe(1);
  expect(result.stdout).toContain('Failed to enable auto merge');
});
