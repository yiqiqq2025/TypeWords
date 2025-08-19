const {SitemapStream, streamToPromise} = require('sitemap')
const {createWriteStream} = require('fs')
const {resolve} = require('path')

// 你的网站域名
const SITE_URL = 'https://yourdomain.com'

// 静态路由（首页、练习页等）
const staticPages = [
  {url: '/', changefreq: 'daily', priority: 1.0},
  {url: '/word', changefreq: 'daily', priority: 0.9},
  {url: '/article', changefreq: 'daily', priority: 0.9},
  {url: '/setting', changefreq: 'monthly', priority: 0.3},
]

// 动态页面示例（假设你有文章或单词数据）
const dynamicPages = [
  {url: '/article/vue-seo', changefreq: 'weekly', priority: 0.8},
  {url: '/article/js-tips', changefreq: 'weekly', priority: 0.8},
  // 如果文章很多，可以用 JSON / API 自动生成数组
]

async function generateSitemap() {
  const sitemap = new SitemapStream({hostname: SITE_URL})
  const writeStream = createWriteStream(resolve(__dirname, '../dist/sitemap.xml'))

  sitemap.pipe(writeStream)

  // 添加静态页
  staticPages.forEach(page => sitemap.write(page))

  // 添加动态页
  dynamicPages.forEach(page => sitemap.write(page))

  sitemap.end()

  await streamToPromise(sitemap)
  console.log('✅ sitemap.xml 已生成在 dist 目录')
}

generateSitemap()
