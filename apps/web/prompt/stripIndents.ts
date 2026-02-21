export function stripIndents(value: string): string;
export function stripIndents(strings: TemplateStringsArray, ...values: readonly unknown[]): string;
export function stripIndents(arg0: string | TemplateStringsArray, ...values: readonly unknown[]): string {
  if (typeof arg0 !== 'string') {
    const processedString = arg0.reduce((acc, curr, i) => {
      return acc + curr + String(values[i] ?? '');
    }, '');

    return _stripIndents(processedString);
  }

  return _stripIndents(arg0);
}

function _stripIndents(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trimStart()
    .replace(/[\r\n]$/, '');
}
