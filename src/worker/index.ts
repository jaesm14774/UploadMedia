/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import type { Context, Next } from 'hono'

export interface MediaItem {
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
  r2_key?: string
}

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 和錯誤處理中間件
app.use('*', cors())
app.use('*', async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error: unknown) {
    if (error instanceof HTTPException) {
      return error.getResponse()
    }
    console.error('Unexpected error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// 初始化資料庫表
app.get('/init', async (c) => {
  try {
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
  } catch (error) {
    console.error('Database initialization error:', error)
    throw new HTTPException(500, { message: 'Failed to initialize database' })
  }
})

// 獲取所有媒體組
app.get('/api/media-groups', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM media_items 
    WHERE is_group = true 
    ORDER BY timestamp DESC
  `).all<MediaItem>()
  return c.json(results)
})

// 獲取特定組的所有媒體
app.get('/api/media-groups/:groupId', async (c) => {
  const { groupId } = c.req.param()
  if (!groupId) {
    throw new HTTPException(400, { message: 'Group ID is required' })
  }

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM media_items 
    WHERE group_id = ?
  `).bind(groupId).all<MediaItem>()

  if (!results.length) {
    throw new HTTPException(404, { message: 'Media group not found' })
  }

  return c.json(results)
})

// 上傳媒體組
app.post('/api/media-groups', async (c) => {
  const data = await c.req.json<{
    files: MediaItem[]
    prompt: string
    aiModel?: string
  }>()
  const { files, prompt, aiModel } = data

  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new HTTPException(400, { message: 'Files are required' })
  }

  const groupId = crypto.randomUUID()
  const timestamp = Date.now()

  try {
    // 開始事務
    await c.env.DB.prepare('BEGIN TRANSACTION').run()

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

    // 上傳每個文件
    for (const file of files) {
      const fileId = crypto.randomUUID()
      const r2Key = `media/${groupId}/${fileId}`
      
      // 驗證文件數據
      if (!file.data || !file.type) {
        throw new HTTPException(400, { message: 'Invalid file data' })
      }

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

    // 提交事務
    await c.env.DB.prepare('COMMIT').run()
    return c.json({ id: groupId }, 201)

  } catch (error) {
    // 回滾事務
    await c.env.DB.prepare('ROLLBACK').run()
    console.error('Upload error:', error)
    throw new HTTPException(500, { message: 'Failed to upload media group' })
  }
})

// 刪除媒體組
app.delete('/api/media-groups/:groupId', async (c) => {
  const { groupId } = c.req.param()
  if (!groupId) {
    throw new HTTPException(400, { message: 'Group ID is required' })
  }

  try {
    // 開始事務
    await c.env.DB.prepare('BEGIN TRANSACTION').run()

    // 獲取組內所有文件
    const { results } = await c.env.DB.prepare(`
      SELECT r2_key FROM media_items 
      WHERE group_id = ? OR id = ?
    `).bind(groupId, groupId).all<{ r2_key: string }>()

    // 從 R2 刪除所有文件
    for (const item of results) {
      if (item.r2_key) {
        await c.env.BUCKET.delete(item.r2_key)
      }
    }

    // 從數據庫刪除所有相關記錄
    const { success } = await c.env.DB.prepare(`
      DELETE FROM media_items 
      WHERE group_id = ? OR id = ?
    `).bind(groupId, groupId).run()

    if (!success) {
      throw new Error('Failed to delete database records')
    }

    // 提交事務
    await c.env.DB.prepare('COMMIT').run()
    return c.json({ message: 'Media group deleted' })

  } catch (error) {
    // 回滾事務
    await c.env.DB.prepare('ROLLBACK').run()
    console.error('Delete error:', error)
    throw new HTTPException(500, { message: 'Failed to delete media group' })
  }
})

// 更新媒體組的提示詞
app.patch('/api/media-groups/:groupId', async (c) => {
  const { groupId } = c.req.param()
  if (!groupId) {
    throw new HTTPException(400, { message: 'Group ID is required' })
  }

  const { prompt } = await c.req.json<{ prompt: string }>()
  if (!prompt) {
    throw new HTTPException(400, { message: 'Prompt is required' })
  }

  try {
    const { success } = await c.env.DB.prepare(`
      UPDATE media_items 
      SET prompt = ? 
      WHERE id = ?
    `).bind(prompt, groupId).run()

    if (!success) {
      throw new HTTPException(404, { message: 'Media group not found' })
    }

    return c.json({ message: 'Prompt updated' })
  } catch (error) {
    console.error('Update error:', error)
    throw new HTTPException(500, { message: 'Failed to update prompt' })
  }
})

export default app 