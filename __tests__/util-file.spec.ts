import * as fs from 'fs';
import * as path from 'path';
import { readFileSync } from '../src/util/file';

const packageJsonPath = path.resolve(__dirname, '../package.json');

test('readFileSync reads a real file and returns its exact contents', () => {
  const result = readFileSync(packageJsonPath).toString();
  const expected = fs.readFileSync(packageJsonPath).toString();

  expect(result).toBe(expected);

  const parsed = JSON.parse(result);
  expect(parsed.name).toBe('deepmerge-yaml');
});

test('readFileSync forwards the encoding argument like fs.readFileSync', () => {
  const result = readFileSync(packageJsonPath, 'utf8');
  const expected = fs.readFileSync(packageJsonPath, 'utf8');

  expect(result).toBe(expected);
  expect(typeof result).toBe('string');
});
