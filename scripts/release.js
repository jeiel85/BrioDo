#!/usr/bin/env node
/* global process */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

const version = process.argv[2]

if (!version) {
  console.error('사용법: npm run release <버전>')
  console.error('예시:  npm run release 1.1.8')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`올바르지 않은 버전 형식: ${version} (예: 1.1.8)`)
  process.exit(1)
}

// src/App.jsx 업데이트
const appJsx = readFileSync('src/App.jsx', 'utf8')
const currentAppVersion = appJsx.match(/const APP_VERSION = '(.+?)'/)?.[1]
if (!currentAppVersion) {
  console.error('src/App.jsx에서 APP_VERSION을 찾을 수 없습니다.')
  process.exit(1)
}
writeFileSync('src/App.jsx', appJsx.replace(
  `const APP_VERSION = '${currentAppVersion}'`,
  `const APP_VERSION = '${version}'`
))
console.log(`✓ src/App.jsx: ${currentAppVersion} → ${version}`)

// android/app/build.gradle 업데이트
const gradle = readFileSync('android/app/build.gradle', 'utf8')
const currentVersionName = gradle.match(/versionName "(.+?)"/)?.[1]
const currentVersionCode = parseInt(gradle.match(/versionCode (\d+)/)?.[1])
if (!currentVersionName || !currentVersionCode) {
  console.error('build.gradle에서 versionName/versionCode를 찾을 수 없습니다.')
  process.exit(1)
}
const newVersionCode = currentVersionCode + 1
writeFileSync('android/app/build.gradle', gradle
  .replace(`versionCode ${currentVersionCode}`, `versionCode ${newVersionCode}`)
  .replace(`versionName "${currentVersionName}"`, `versionName "${version}"`)
)
console.log(`✓ build.gradle: ${currentVersionName} → ${version} (versionCode ${currentVersionCode} → ${newVersionCode})`)

// 버전 일치 검증
const verifyApp = readFileSync('src/App.jsx', 'utf8').match(/const APP_VERSION = '(.+?)'/)?.[1]
const verifyGradle = readFileSync('android/app/build.gradle', 'utf8').match(/versionName "(.+?)"/)?.[1]
if (verifyApp !== version || verifyGradle !== version) {
  console.error('버전 불일치 오류! 파일을 직접 확인하세요.')
  process.exit(1)
}
console.log(`✓ 버전 일치 확인: 양쪽 모두 ${version}`)

// git commit + push + tag
execSync('git add src/App.jsx android/app/build.gradle', { stdio: 'inherit' })
execSync(`git commit -m "bump: v${currentVersionName} → v${version} (versionCode ${currentVersionCode} → ${newVersionCode})"`, { stdio: 'inherit' })
execSync('git push origin main', { stdio: 'inherit' })
execSync(`git tag v${version}`, { stdio: 'inherit' })
execSync(`git push origin v${version}`, { stdio: 'inherit' })

console.log(`\n🚀 v${version} 태그 푸시 완료! GitHub Actions가 APK를 빌드 중입니다.`)
