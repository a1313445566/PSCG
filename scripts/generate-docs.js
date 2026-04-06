const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

marked.setOptions({ gfm: true, breaks: true });

const DOCS_DIR = path.resolve(__dirname, '../DOCS');
const OUTPUT_FILE = path.resolve(__dirname, '../public/docs-data.json');

async function scanDocsDir(dir, basePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const children = await scanDocsDir(fullPath, relativePath);
      if (children.length > 0) {
        items.push({
          type: 'directory',
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'),
          children
        });
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1] : entry.name.replace('.md', '');
      const html = marked.parse(content);

      // 获取文件真实的时间戳
      const stats = fs.statSync(fullPath);
      const createdAt = stats.birthtime.toISOString();
      const updatedAt = stats.mtime.toISOString();

      items.push({
        type: 'file',
        name: entry.name,
        title,
        path: relativePath.replace(/\\/g, '/'),
        html,
        createdAt,
        updatedAt
      });
    }
  }

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  return items;
}

async function generate() {
  console.log('📚 开始扫描 DOCS 目录...');
  console.log(`DOCS_DIR: ${DOCS_DIR}`);

  if (!fs.existsSync(DOCS_DIR)) {
    console.error('❌ DOCS 目录不存在!');
    process.exit(1);
  }

  const docsTree = await scanDocsDir(DOCS_DIR);

  let totalFiles = 0, totalDirs = 0;
  function count(items) {
    items.forEach(item => {
      if (item.type === 'directory') { totalDirs++; if (item.children) count(item.children); }
      else totalFiles++;
    });
  }
  count(docsTree);

  const data = {
    stats: { totalFiles, totalDirs, generatedAt: new Date().toISOString() },
    tree: docsTree
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n✅ 文档数据生成完成!');
  console.log(`   - 文件数: ${totalFiles}`);
  console.log(`   - 目录数: ${totalDirs}`);
  console.log(`   - 输出路径: ${OUTPUT_FILE}`);
  console.log(`   - 文件大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
}

generate().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
