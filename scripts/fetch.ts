import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from 'prettier'

async function getExcalidrawData(url: string) {
  const response = await fetch(url)
  const html = await response.text()
  const reg = /React\.createElement\(ExcalidrawLib\.Excalidraw, ({[\s\S]*?})\)/gm
  const [, excalidrawStr] = reg.exec(html) || []
  let result = ''
  try {
    result = await prettier.format(
      `const excalidrawData = ${excalidrawStr}`,
      { semi: false, parser: "babel" }
    )
  } catch (e) {
    console.error(e)
  }
  return result
}

async function update(url: string, dist: string) {
  const distPath = resolve(dirname(fileURLToPath(import.meta.url)), dist)
  const excalidrawDataStr = await getExcalidrawData(url)
  if (!excalidrawDataStr) {
    console.error(`× not found ${url}`)
    return
  }
  const sourceData = (await readFile(distPath)).toString()
  const reg = /\/\/ === Excalidraw Start ===\n([\s\S]*)\/\/ === Excalidraw End ===/gm
  if (!reg.test(sourceData)) {
    console.error(`× not match ${url}`)
    return
  }
  // console.log(reg.test(sourceData))
  const updateData = sourceData.replace(reg, `// === Excalidraw Start ===\n${excalidrawDataStr}// === Excalidraw End ===`)
  await writeFile(distPath, updateData)
}

async function run() {
  const fetchList = [
    update('https://learnblockchain.cn/maps/Roadmap', '../roadmap.js'),
    update('https://learnblockchain.cn/maps/Solana', '../solana.js'),
    update('https://learnblockchain.cn/maps/BTC', '../btc.js'),
    update('https://learnblockchain.cn/maps/EVM', '../evm.js'),
    update('https://learnblockchain.cn/maps/Move', '../move.js'),
    update('https://learnblockchain.cn/maps/Web3', '../web3.js'),
    update('https://learnblockchain.cn/maps/ZKP', '../ZKP.js'),
    update('https://learnblockchain.cn/maps/Job', '../job.js'),
  ]
  await Promise.all(fetchList)
  console.log('√ success')
}

run()
