import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());

const files = {
  packageJson: resolve(rootDir, "package.json"),
  cargoToml: resolve(rootDir, "src-tauri/Cargo.toml"),
  cargoLock: resolve(rootDir, "src-tauri/Cargo.lock"),
  tauriConf: resolve(rootDir, "src-tauri/tauri.conf.json"),
};

function bumpPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/);
  if (!match) {
    throw new Error(`invalid semver version: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] ?? "";
  const buildMeta = match[5] ?? "";

  if (prerelease || buildMeta) {
    throw new Error(
      `only plain x.y.z is supported for auto bump, got: ${version}`,
    );
  }

  return `${major}.${minor}.${patch + 1}`;
}

function replaceCargoVersion(content, nextVersion) {
  const headerPattern = /(\[package\][\s\S]*?\nversion\s*=\s*")([^"]+)(")/;
  if (!headerPattern.test(content)) {
    throw new Error("failed to locate [package] version in Cargo.toml");
  }

  return content.replace(headerPattern, `$1${nextVersion}$3`);
}

function replaceCargoLockPackageVersion(content, packageName, nextVersion) {
  const pattern = new RegExp(
    `(\\[\\[package\\]\\][\\s\\S]*?\\nname = "${packageName}"\\nversion = ")` +
      `([^"]+)` +
      `(")`,
  );
  if (!pattern.test(content)) {
    throw new Error(`failed to locate ${packageName} in Cargo.lock`);
  }

  return content.replace(pattern, `$1${nextVersion}$3`);
}

const packageJson = JSON.parse(readFileSync(files.packageJson, "utf8"));
const currentVersion = packageJson.version;
if (!currentVersion || typeof currentVersion !== "string") {
  throw new Error("package.json missing string version field");
}

const nextVersion = bumpPatch(currentVersion);
packageJson.version = nextVersion;
writeFileSync(files.packageJson, `${JSON.stringify(packageJson, null, 2)}\n`);

const cargoToml = readFileSync(files.cargoToml, "utf8");
writeFileSync(files.cargoToml, replaceCargoVersion(cargoToml, nextVersion));

const cargoLock = readFileSync(files.cargoLock, "utf8");
writeFileSync(
  files.cargoLock,
  replaceCargoLockPackageVersion(cargoLock, "tauri-app", nextVersion),
);

const tauriConf = JSON.parse(readFileSync(files.tauriConf, "utf8"));
if (!tauriConf.version || typeof tauriConf.version !== "string") {
  throw new Error("tauri.conf.json missing string version field");
}

tauriConf.version = nextVersion;
writeFileSync(files.tauriConf, `${JSON.stringify(tauriConf, null, 2)}\n`);

process.stdout.write(`${currentVersion} -> ${nextVersion}\n`);
