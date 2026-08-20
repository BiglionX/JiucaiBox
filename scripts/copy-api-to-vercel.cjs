#!/usr/bin/env node
/**
 * Vercel 构建后：
 *   1. 把 apps/api/dist/* 复制到 api/dist/*（vercel.js 内部 require 相对路径）
 *   2. 把 apps/api/dist/vercel.js 复制到 api/index.js 作为 Vercel 约定入口
 * 这样 Vercel 通过仓库根 api/ 目录自动识别为 serverless functions，
 * 且函数内 require('./dist/...') 能解析到本地 dist 目录。
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDist = path.join(root, 'apps', 'api', 'dist');
const srcEntry = path.join(srcDist, 'vercel.js');
const apiDir = path.join(root, 'api');
const apiDist = path.join(apiDir, 'dist');
const apiEntry = path.join(apiDir, 'index.js');

if (!fs.existsSync(srcEntry)) {
  console.error(`[copy-api-to-vercel] 源文件不存在: ${srcEntry}`);
  process.exit(1);
}

fs.mkdirSync(apiDir, { recursive: true });
fs.mkdirSync(apiDist, { recursive: true });

// 清空 api/dist（避免上次残留）
for (const entry of fs.readdirSync(apiDist, { withFileTypes: true })) {
  fs.rmSync(path.join(apiDist, entry.name), { recursive: true, force: true });
}
// 复制 apps/api/dist/* -> api/dist/*
copyDirSync(srcDist, apiDist);
// 复制 apps/api/dist/vercel.js -> api/index.js
fs.copyFileSync(srcEntry, apiEntry);

// 改写 api/index.js 的 require 路径：./xxx -> ./dist/xxx
const entryContent = fs.readFileSync(apiEntry, 'utf8');
const patched = entryContent.replace(/require\("\.\/([^"]+)"\)/g, 'require("./dist/$1")')
                             .replace(/require\('\.\/([^']+)'\)/g, "require('./dist/$1')");
fs.writeFileSync(apiEntry, patched, 'utf8');

console.log(`[copy-api-to-vercel] dist 已复制: ${srcDist} -> ${apiDist}`);
console.log(`[copy-api-to-vercel] 入口已就绪: ${apiEntry}（require 已重写为 ./dist/...）`);

function copyDirSync(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const entry of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, entry.name);
    const dp = path.join(d, entry.name);
    if (entry.isDirectory()) copyDirSync(sp, dp);
    else fs.copyFileSync(sp, dp);
  }
}