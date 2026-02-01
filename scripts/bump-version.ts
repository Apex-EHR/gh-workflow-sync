#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Semantic Versioning Bump Script
 * Usage: deno run --allow-read --allow-write scripts/bump-version.ts [major|minor|patch]
 */

const versionFile = './deno.json'

function parseVersion(version: string): [number, number, number] {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Invalid version format: ${version}. Expected: MAJOR.MINOR.PATCH`)
  }
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
}

function bumpVersion(current: string, type: string): string {
  const [major, minor, patch] = parseVersion(current)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type: ${type}. Use: major, minor, or patch`)
  }
}

async function main() {
  const bumpType = Deno.args[0] || 'patch'

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: deno run --allow-read --allow-write scripts/bump-version.ts [major|minor|patch]')
    Deno.exit(1)
  }

  // Read current version
  const content = await Deno.readTextFile(versionFile)
  const config = JSON.parse(content)
  const currentVersion = config.version

  console.log(`Current version: ${currentVersion}`)

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType)
  console.log(`New version: ${newVersion}`)

  // Update deno.json
  config.version = newVersion
  await Deno.writeTextFile(versionFile, JSON.stringify(config, null, 2) + '\n')

  console.log(`✅ Updated ${versionFile} to version ${newVersion}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Review changes: git diff`)
  console.log(`  2. Commit: git add ${versionFile} && git commit -m "chore: bump version to ${newVersion}"`)
  console.log(`  3. Tag: git tag -a v${newVersion} -m "Release v${newVersion}"`)
  console.log(`  4. Push: git push origin main && git push origin v${newVersion}`)
}

await main()
