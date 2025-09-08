#!/usr/bin/env node

/**
 * Studdy 项目文档自动更新脚本
 * 用于自动更新 install 目录中的文档内容
 * 确保文档与项目开发进度保持同步
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`)
};

// 项目路径
const projectRoot = path.resolve(__dirname, '..');
const installDir = __dirname;
const clientDir = path.join(projectRoot, 'client');
const serverDir = path.join(projectRoot, 'server');

/**
 * 读取 package.json 文件
 */
function readPackageJson(dir) {
  try {
    const packagePath = path.join(dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    }
  } catch (error) {
    log.warning(`无法读取 ${dir}/package.json: ${error.message}`);
  }
  return null;
}

/**
 * 获取项目版本信息
 */
function getVersionInfo() {
  const rootPackage = readPackageJson(projectRoot);
  const clientPackage = readPackageJson(clientDir);
  const serverPackage = readPackageJson(serverDir);
  
  return {
    root: rootPackage?.version || '1.0.0',
    client: clientPackage?.version || '1.0.0',
    server: serverPackage?.version || '1.0.0'
  };
}

/**
 * 获取依赖信息
 */
function getDependencies() {
  const rootPackage = readPackageJson(projectRoot);
  const clientPackage = readPackageJson(clientDir);
  const serverPackage = readPackageJson(serverDir);
  
  return {
    root: {
      dependencies: rootPackage?.dependencies || {},
      devDependencies: rootPackage?.devDependencies || {}
    },
    client: {
      dependencies: clientPackage?.dependencies || {},
      devDependencies: clientPackage?.devDependencies || {}
    },
    server: {
      dependencies: serverPackage?.dependencies || {},
      devDependencies: serverPackage?.devDependencies || {}
    }
  };
}

/**
 * 获取 Git 信息
 */
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf8' }).trim();
    
    return { branch, commit, lastCommitDate };
  } catch (error) {
    log.warning('无法获取 Git 信息，可能不在 Git 仓库中');
    return { branch: 'unknown', commit: 'unknown', lastCommitDate: new Date().toISOString().split('T')[0] };
  }
}

/**
 * 更新依赖文档
 */
function updateDependenciesDoc() {
  log.info('更新依赖文档...');
  
  const deps = getDependencies();
  const versions = getVersionInfo();
  const gitInfo = getGitInfo();
  
  // 读取现有文档
  const depsDocPath = path.join(installDir, 'dependencies.md');
  let content = fs.readFileSync(depsDocPath, 'utf8');
  
  // 更新版本信息
  const versionSection = `## 当前版本信息

- **项目版本**: ${versions.root}
- **前端版本**: ${versions.client}
- **后端版本**: ${versions.server}
- **Git 分支**: ${gitInfo.branch}
- **Git 提交**: ${gitInfo.commit}
- **最后更新**: ${gitInfo.lastCommitDate}
`;
  
  // 替换版本信息部分
  content = content.replace(
    /## 当前版本信息[\s\S]*?(?=\n## |$)/,
    versionSection
  );
  
  // 如果没有版本信息部分，在文档开头添加
  if (!content.includes('## 当前版本信息')) {
    const lines = content.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## ')) || 1;
    lines.splice(insertIndex, 0, versionSection);
    content = lines.join('\n');
  }
  
  fs.writeFileSync(depsDocPath, content);
  log.success('依赖文档已更新');
}

/**
 * 更新功能文档
 */
function updateFeaturesDoc() {
  log.info('更新功能文档...');
  
  const versions = getVersionInfo();
  const gitInfo = getGitInfo();
  
  const featuresDocPath = path.join(installDir, 'features.md');
  let content = fs.readFileSync(featuresDocPath, 'utf8');
  
  // 更新文档底部的版本信息
  const footerPattern = /---\s*\*\*版本\*\*:[\s\S]*$/;
  const newFooter = `---

**版本**: v${versions.root}  
**更新时间**: ${gitInfo.lastCommitDate}  
**Git 提交**: ${gitInfo.commit}  
**文档维护**: Studdy 开发团队
`;
  
  if (footerPattern.test(content)) {
    content = content.replace(footerPattern, newFooter);
  } else {
    content += '\n' + newFooter;
  }
  
  fs.writeFileSync(featuresDocPath, content);
  log.success('功能文档已更新');
}

/**
 * 更新更新日志
 */
function updateChangelog() {
  log.info('检查更新日志...');
  
  const changelogPath = path.join(installDir, 'changelog.md');
  let content = fs.readFileSync(changelogPath, 'utf8');
  
  const versions = getVersionInfo();
  const gitInfo = getGitInfo();
  
  // 检查是否需要添加新版本
  const currentVersion = `[${versions.root}]`;
  if (!content.includes(currentVersion)) {
    log.info(`检测到新版本 ${versions.root}，准备添加到更新日志...`);
    
    const newVersionEntry = `## [${versions.root}] - ${gitInfo.lastCommitDate} 🆕

### 新增功能
- ✨ **待补充** - 请手动添加本版本的新功能描述

### 技术改进
- 🔧 版本更新至 ${versions.root}
- 🔧 Git 提交: ${gitInfo.commit}

### 修复问题
- 🐛 **待补充** - 请手动添加本版本修复的问题

---

`;
    
    // 在第一个版本条目之前插入新版本
    const versionPattern = /## \[\d+\.\d+\.\d+\]/;
    const match = content.match(versionPattern);
    
    if (match) {
      const insertIndex = content.indexOf(match[0]);
      content = content.slice(0, insertIndex) + newVersionEntry + content.slice(insertIndex);
    } else {
      // 如果没有找到版本条目，在文档开头添加
      const headerEnd = content.indexOf('\n## ');
      if (headerEnd !== -1) {
        content = content.slice(0, headerEnd + 1) + '\n' + newVersionEntry + content.slice(headerEnd + 1);
      }
    }
    
    fs.writeFileSync(changelogPath, content);
    log.success(`已添加版本 ${versions.root} 到更新日志`);
    log.warning('请手动编辑 changelog.md 添加具体的功能描述和修复内容');
  } else {
    log.success('更新日志已是最新版本');
  }
}

/**
 * 更新配置文档
 */
function updateConfigDoc() {
  log.info('更新配置文档...');
  
  const configDocPath = path.join(installDir, 'config.md');
  let content = fs.readFileSync(configDocPath, 'utf8');
  
  const gitInfo = getGitInfo();
  
  // 更新文档底部的维护信息
  const footerPattern = /---\s*\*\*配置维护\*\*:[\s\S]*$/;
  const newFooter = `---

**配置维护**: Studdy 开发团队  
**文档更新**: ${gitInfo.lastCommitDate}
`;
  
  if (footerPattern.test(content)) {
    content = content.replace(footerPattern, newFooter);
  } else {
    content += '\n' + newFooter;
  }
  
  fs.writeFileSync(configDocPath, content);
  log.success('配置文档已更新');
}

/**
 * 验证文档完整性
 */
function validateDocs() {
  log.info('验证文档完整性...');
  
  const requiredFiles = [
    'README.md',
    'install.sh',
    'install.bat',
    'dependencies.md',
    'features.md',
    'changelog.md',
    'config.md'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(installDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    log.error(`缺少以下文件: ${missingFiles.join(', ')}`);
    return false;
  }
  
  log.success('所有必需文档都存在');
  return true;
}

/**
 * 生成文档统计信息
 */
function generateStats() {
  log.info('生成文档统计信息...');
  
  const files = fs.readdirSync(installDir).filter(file => file.endsWith('.md'));
  const stats = {
    totalFiles: files.length,
    totalSize: 0,
    files: []
  };
  
  files.forEach(file => {
    const filePath = path.join(installDir, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    stats.totalSize += stat.size;
    stats.files.push({
      name: file,
      size: stat.size,
      lines: content.split('\n').length,
      lastModified: stat.mtime.toISOString().split('T')[0]
    });
  });
  
  console.log('\n📊 文档统计信息:');
  console.log(`   总文件数: ${stats.totalFiles}`);
  console.log(`   总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`);
  console.log('\n   文件详情:');
  
  stats.files.forEach(file => {
    console.log(`   ${file.name.padEnd(20)} ${file.lines.toString().padStart(4)} 行  ${(file.size / 1024).toFixed(2).padStart(6)} KB  ${file.lastModified}`);
  });
}

/**
 * 主函数
 */
function main() {
  log.title('🔄 Studdy 项目文档自动更新');
  
  try {
    // 验证文档完整性
    if (!validateDocs()) {
      process.exit(1);
    }
    
    // 更新各个文档
    updateDependenciesDoc();
    updateFeaturesDoc();
    updateChangelog();
    updateConfigDoc();
    
    // 生成统计信息
    generateStats();
    
    log.title('✅ 文档更新完成!');
    log.info('建议定期运行此脚本以保持文档同步');
    log.info('使用方法: node install/update-docs.js');
    
  } catch (error) {
    log.error(`文档更新失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  updateDependenciesDoc,
  updateFeaturesDoc,
  updateChangelog,
  updateConfigDoc,
  validateDocs,
  generateStats
};