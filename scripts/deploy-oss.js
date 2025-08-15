import OSS from 'ali-oss'
import fs from 'fs'
import path from 'path'
import Core from '@alicloud/pop-core'

const {
  OSS_REGION,
  OSS_KEY_ID,
  OSS_KEY_SECRET,
  OSS_BUCKET,
  CDN_DOMAIN
} = process.env

if (!OSS_REGION || !OSS_KEY_ID || !OSS_KEY_SECRET || !OSS_BUCKET || !CDN_DOMAIN) {
  console.error('❌ 缺少必要的环境变量，请检查 GitHub Secrets 配置')
  process.exit(1)
}

const client = new OSS({
  region: OSS_REGION,
  accessKeyId: OSS_KEY_ID,
  accessKeySecret: OSS_KEY_SECRET,
  bucket: OSS_BUCKET
})

const cdnClient = new Core({
  accessKeyId: OSS_KEY_ID,
  accessKeySecret: OSS_KEY_SECRET,
  endpoint: 'https://cdn.aliyuncs.com',
  apiVersion: '2018-05-10'
})

// 遍历 dist 目录，统计文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  }
  return fileList
}

// 上传文件，显示进度，可跳过指定目录
/**
 * @param {string[]} files - 要上传的所有文件完整路径
 * @param {string} localBase - 本地基准路径
 * @param {string[]} ignoreDirs - 相对 localBase 的目录名数组，上传时会跳过这些目录
 */
async function uploadFiles(files, localBase = './dist', ignoreDirs = []) {
  const filteredFiles = files.filter(file => {
    const relativePath = path.relative(localBase, file)
    // 获取文件所在目录的第一级
    const topDir = relativePath.split(path.sep)[0]
    // 如果在 ignoreDirs 中，就跳过
    return !ignoreDirs.includes(topDir)
  })

  const total = filteredFiles.length
  let count = 0

  for (const file of filteredFiles) {
    const relativePath = path.relative(localBase, file)
    const remotePath = relativePath.split(path.sep).join('/') // 转 POSIX 路径
    await client.put(remotePath, file)
    count++
    const percent = ((count / total) * 100).toFixed(1)
    process.stdout.write(`\r📤 上传进度: ${count}/${total} (${percent}%) ${remotePath}       `)
  }
  console.log('\n✅ 文件全部上传完成')
}


// 刷新 CDN
async function refreshCDN() {
  console.log('🔄 刷新 CDN 缓存...')
  const params = {
    ObjectPath: `https://${CDN_DOMAIN}/*`,
    ObjectType: 'File'
  }
  const requestOption = {method: 'POST'}
  const result = await cdnClient.request('RefreshObjectCaches', params, requestOption)
  console.log('✅ CDN 刷新完成:', result)
}

async function main() {
  const files = getAllFiles('./dist')
  console.log(`📁 共找到 ${files.length} 个文件，开始上传...`)
  await uploadFiles(files, './dist', ['dicts', 'sound'])
  await refreshCDN()
}

main().catch(err => {
  console.error('❌ 部署失败:', err)
  process.exit(1)
})
