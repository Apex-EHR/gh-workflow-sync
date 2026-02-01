#!/usr/bin/env -S deno run --allow-run=deno --allow-read --allow-env

const os = Deno.build.os
const arch = Deno.build.arch

let target: string
let output: string

if (os === 'linux') {
  if (arch === 'aarch64') {
    target = 'aarch64-unknown-linux-gnu'
    output = 'bin/apex-gh-workflow-sync-linux-arm64'
  } else {
    target = 'x86_64-unknown-linux-gnu'
    output = 'bin/apex-gh-workflow-sync-linux-x64'
  }
} else if (os === 'windows') {
  target = 'x86_64-pc-windows-msvc'
  output = 'bin/apex-gh-workflow-sync-windows.exe'
} else if (os === 'darwin') {
  if (arch === 'aarch64') {
    target = 'aarch64-apple-darwin'
    output = 'bin/apex-gh-workflow-sync-macos'
  } else {
    target = 'x86_64-apple-darwin'
    output = 'bin/apex-gh-workflow-sync-macos-intel'
  }
} else {
  console.error(`Unsupported OS: ${os}`)
  Deno.exit(1)
}

console.log(`Compiling for ${os} (${arch}) -> ${output}`)

const process = new Deno.Command('deno', {
  args: [
    'compile',
    '--allow-run=gh,git',
    '--allow-read',
    '--allow-write',
    '--allow-env',
    '--target',
    target,
    '-o',
    output,
    'main.ts',
  ],
  stdout: 'inherit',
  stderr: 'inherit',
})

const { code } = await process.output()
Deno.exit(code)
