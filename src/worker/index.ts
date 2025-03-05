import { Hono } from 'hono'
import { cors } from 'hono/cors'

interface MediaItem {
  id: string
  name: string
  type: string
  data: string
  preview?: string
  prompt: string
  aiModel?: string
  timestamp: number
  isGroup: boolean
  groupId?: string
}

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// 初始化資料庫表
app.get('/init', async (c) => {
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      prompt TEXT,
      ai_model TEXT,
      timestamp INTEGER NOT NULL,
      is_group BOOLEAN DEFAULT FALSE,
      group_id TEXT,
      r2_key TEXT NOT NULL
    )
  `).run()
  
  return c.json({ message: 'Database initialized' })
})

// 獲取所有媒體組
app.get('/api/media-groups', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM media_items 
    WHERE is_group = true 
    ORDER BY timestamp DESC
  `).all()
  return c.json(results)
})

// 獲取特定組的所有媒體
app.get('/api/media-groups/:groupId/items', async (c) => {
  const groupId = c.param('groupId')
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM media_items 
    WHERE group_id = ?
  `).bind(groupId).all()
  return c.json(results)
})

// 上傳媒體組
app.post('/api/media-groups', async (c) => {
  const data = await c.req.json()
  const { files, prompt, aiModel } = data
  const groupId = crypto.randomUUID()
  const timestamp = Date.now()

  // 創建媒體組
  await c.env.DB.prepare(`
    INSERT INTO media_items (id, name, type, prompt, ai_model, timestamp, is_group, r2_key)
    VALUES (?, ?, ?, ?, ?, ?, true, ?)
  `).bind(
    groupId,
    'group',
    'group',
    prompt,
    aiModel,
    timestamp,
    `groups/${groupId}`
  ).run()

  // 上傳每個文件到 R2
  for (const file of files) {
    const fileId = crypto.randomUUID()
    const r2Key = `media/${groupId}/${fileId}`
    
    // 將文件數據轉換為 Buffer 並上傳到 R2
    const fileData = Buffer.from(file.data.split(',')[1], 'base64')
    await c.env.BUCKET.put(r2Key, fileData, {
      httpMetadata: {
        contentType: file.type
      }
    })

    // 在數據庫中保存文件信息
    await c.env.DB.prepare(`
      INSERT INTO media_items (id, name, type, timestamp, group_id, r2_key)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      fileId,
      file.name,
      file.type,
      timestamp,
      groupId,
      r2Key
    ).run()
  }

  return c.json({ id: groupId }, 201)
})

// 刪除媒體組
app.delete('/api/media-groups/:groupId', async (c) => {
  const groupId = c.param('groupId')

  // 獲取組內所有文件
  const { results } = await c.env.DB.prepare(`
    SELECT r2_key FROM media_items 
    WHERE group_id = ? OR id = ?
  `).bind(groupId, groupId).all()

  // 從 R2 刪除所有文件
  for (const item of results) {
    await c.env.BUCKET.delete(item.r2_key)
  }

  // 從數據庫刪除所有相關記錄
  await c.env.DB.prepare(`
    DELETE FROM media_items 
    WHERE group_id = ? OR id = ?
  `).bind(groupId, groupId).run()

  return c.json({ message: 'Media group deleted' })
})

// 更新媒體組的提示詞
app.patch('/api/media-groups/:groupId', async (c) => {
  const groupId = c.param('groupId')
  const { prompt } = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE media_items 
    SET prompt = ? 
    WHERE id = ?
  `).bind(prompt, groupId).run()

  return c.json({ message: 'Prompt updated' })
})

export default app 