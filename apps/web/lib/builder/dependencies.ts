// lib/builder/dependencies.ts

interface PackageJson {
  dependencies?: Record<string, string>;
}

export function ensureReactDeps(packageJson: PackageJson) {
  packageJson.dependencies = {
    ...packageJson.dependencies,
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
  };

  return packageJson;
}