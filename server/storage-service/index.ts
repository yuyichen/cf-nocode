import type { R2Bucket } from '@cloudflare/workers-types';

interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  path: string;
  isPublic: boolean;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

interface UploadOptions {
  isPublic?: boolean;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  maxSize?: number;
  allowedTypes?: string[];
}

export class StorageService {
  constructor(private bucket: R2Bucket, private db: any) {}

  async uploadFile(
    file: ArrayBuffer, 
    fileName: string, 
    mimeType: string,
    userId: string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; file?: FileMetadata; error?: string }> {
    try {
      const {
        isPublic = false,
        tags = {},
        metadata = {},
        maxSize = 100 * 1024 * 1024,
        allowedTypes = []
      } = options;

      if (file.byteLength > maxSize) {
        return { 
          success: false, 
          error: `File size exceeds maximum allowed size of ${maxSize} bytes` 
        };
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
        return { 
          success: false, 
          error: `File type ${mimeType} is not allowed` 
        };
      }

      const fileId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const fileKey = `${userId}/${timestamp}/${fileId}-${fileName}`;

      const uploadResult = await this.bucket.put(fileKey, file, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: isPublic ? 'public, max-age=31536000' : 'private'
        },
        customMetadata: {
          originalName: fileName,
          uploadedBy: userId,
          uploadedAt: timestamp,
          ...metadata
        }
      });

      if (!uploadResult) {
        return { success: false, error: 'Failed to upload file to storage' };
      }

      const fileRecord: Omit<FileMetadata, 'id'> = {
        name: fileId,
        originalName: fileName,
        mimeType,
        size: file.byteLength,
        uploadedBy: userId,
        uploadedAt: timestamp,
        path: fileKey,
        isPublic,
        tags,
        metadata
      };

      await this.db.prepare(`
        INSERT INTO files (
          id, name, original_name, mime_type, size, uploaded_by, 
          uploaded_at, path, is_public, tags, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        fileId,
        fileRecord.name,
        fileRecord.originalName,
        fileRecord.mimeType,
        fileRecord.size,
        fileRecord.uploadedBy,
        fileRecord.uploadedAt,
        fileRecord.isPublic ? 1 : 0,
        JSON.stringify(tags),
        JSON.stringify(metadata)
      ).run();

      return { 
        success: true, 
        file: { id: fileId, ...fileRecord }
      };
    } catch (error: any) {
      console.error('File upload error:', error);
      return { success: false, error: error.message };
    }
  }

  async getFile(fileId: string, userId?: string): Promise<{ success: boolean; file?: any; metadata?: FileMetadata; error?: string }> {
    try {
      const fileRecord = await this.db.prepare(`
        SELECT * FROM files WHERE id = ?
      `).bind(fileId).first() as any;

      if (!fileRecord) {
        return { success: false, error: 'File not found' };
      }

      if (!fileRecord.is_public && userId && fileRecord.uploaded_by !== userId) {
        return { success: false, error: 'Access denied' };
      }

      const object = await this.bucket.get(fileRecord.path);
      if (!object) {
        return { success: false, error: 'File not found in storage' };
      }

      const metadata: FileMetadata = {
        id: fileRecord.id,
        name: fileRecord.name,
        originalName: fileRecord.original_name,
        mimeType: fileRecord.mime_type,
        size: fileRecord.size,
        uploadedBy: fileRecord.uploaded_by,
        uploadedAt: fileRecord.uploaded_at,
        path: fileRecord.path,
        isPublic: fileRecord.is_public === 1,
        tags: fileRecord.tags ? JSON.parse(fileRecord.tags) : {},
        metadata: fileRecord.metadata ? JSON.parse(fileRecord.metadata) : {}
      };

      return {
        success: true,
        file: object.body,
        metadata
      };
    } catch (error: any) {
      console.error('Get file error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fileRecord = await this.db.prepare(`
        SELECT * FROM files WHERE id = ? AND uploaded_by = ?
      `).bind(fileId, userId).first() as any;

      if (!fileRecord) {
        return { success: false, error: 'File not found or access denied' };
      }

      await this.bucket.delete(fileRecord.path);

      await this.db.prepare(`
        DELETE FROM files WHERE id = ?
      `).bind(fileId).run();

      return { success: true };
    } catch (error: any) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  async listFiles(
    userId: string, 
    options: {
      page?: number;
      pageSize?: number;
      mimeType?: string;
      isPublic?: boolean;
      tags?: Record<string, string>;
    } = {}
  ): Promise<{ success: boolean; files?: FileMetadata[]; total?: number; error?: string }> {
    try {
      const {
        page = 1,
        pageSize = 20,
        mimeType,
        isPublic,
        tags
      } = options;

      let whereClause = 'WHERE uploaded_by = ?';
      const bindings: any[] = [userId];

      if (mimeType) {
        whereClause += ' AND mime_type = ?';
        bindings.push(mimeType);
      }

      if (isPublic !== undefined) {
        whereClause += ' AND is_public = ?';
        bindings.push(isPublic ? 1 : 0);
      }

      const countResult = await this.db.prepare(`
        SELECT COUNT(*) as total FROM files ${whereClause}
      `).bind(...bindings).first() as any;

      const total = countResult?.total || 0;

      const offset = (page - 1) * pageSize;
      const { results } = await this.db.prepare(`
        SELECT * FROM files ${whereClause} 
        ORDER BY uploaded_at DESC 
        LIMIT ? OFFSET ?
      `).bind(...bindings, pageSize, offset).all();

      const files: FileMetadata[] = (results || []).map((record: any) => ({
        id: record.id,
        name: record.name,
        originalName: record.original_name,
        mimeType: record.mime_type,
        size: record.size,
        uploadedBy: record.uploaded_by,
        uploadedAt: record.uploaded_at,
        path: record.path,
        isPublic: record.is_public === 1,
        tags: record.tags ? JSON.parse(record.tags) : {},
        metadata: record.metadata ? JSON.parse(record.metadata) : {}
      }));

      return { success: true, files, total };
    } catch (error: any) {
      console.error('List files error:', error);
      return { success: false, error: error.message };
    }
  }

  async getFileUrl(fileId: string, userId?: string, expiresIn = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileResult = await this.getFile(fileId, userId);
      if (!fileResult.success) {
        return { success: false, error: fileResult.error };
      }

      const metadata = fileResult.metadata!;
      
      if (metadata.isPublic) {
        const url = `https://pub-${fileId}.r2.dev/${metadata.path}`;
        return { success: true, url };
      }

      return { success: false, error: 'Signed URLs not implemented yet' };
    } catch (error: any) {
      console.error('Get file URL error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateFileMetadata(
    fileId: string, 
    userId: string, 
    updates: Partial<Pick<FileMetadata, 'isPublic' | 'tags' | 'metadata'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.isPublic !== undefined) {
        updateFields.push('is_public = ?');
        values.push(updates.isPublic ? 1 : 0);
      }

      if (updates.tags !== undefined) {
        updateFields.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }

      if (updates.metadata !== undefined) {
        updateFields.push('metadata = ?');
        values.push(JSON.stringify(updates.metadata));
      }

      if (updateFields.length === 0) {
        return { success: true };
      }

      values.push(fileId, userId);

      await this.db.prepare(`
        UPDATE files 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND uploaded_by = ?
      `).bind(...values).run();

      return { success: true };
    } catch (error: any) {
      console.error('Update file metadata error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStorageStats(userId?: string): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      let whereClause = userId ? 'WHERE uploaded_by = ?' : '';
      const bindings = userId ? [userId] : [];

      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_files,
          SUM(size) as total_size,
          COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_files,
          COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_files
        FROM files ${whereClause}
      `).bind(...bindings).first() as any;

      return {
        success: true,
        stats: {
          totalFiles: stats?.total_files || 0,
          totalSize: stats?.total_size || 0,
          publicFiles: stats?.public_files || 0,
          privateFiles: stats?.private_files || 0
        }
      };
    } catch (error: any) {
      console.error('Get storage stats error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const authHeader = request.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }

    const storage = new StorageService(env.FILE_BUCKET, env.DB);

    try {
      switch (path) {
        case '/upload':
          if (request.method === 'POST') {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const options = JSON.parse(formData.get('options') as string || '{}');
            
            const result = await storage.uploadFile(
              await file.arrayBuffer(),
              file.name,
              file.type,
              userId,
              options
            );
            
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;

        case '/files':
          if (request.method === 'GET') {
            const page = parseInt(url.searchParams.get('page') || '1');
            const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
            const mimeType = url.searchParams.get('mimeType') || undefined;
            const isPublic = url.searchParams.get('isPublic') === 'true' ? true : 
                           url.searchParams.get('isPublic') === 'false' ? false : undefined;
            
            const result = await storage.listFiles(userId, {
              page,
              pageSize,
              mimeType,
              isPublic
            });
            
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;

        case '/stats':
          if (request.method === 'GET') {
            const result = await storage.getStorageStats(userId);
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;

        default:
          if (path.startsWith('/file/') && request.method === 'GET') {
            const fileId = path.split('/')[2];
            const result = await storage.getFile(fileId, userId);
            
            if (!result.success) {
              return Response.json({ error: result.error }, { 
                status: 404,
                headers: { 'Access-Control-Allow-Origin': '*' }
              });
            }

            const object = await (env.FILE_BUCKET as R2Bucket).get(result.metadata!.path);
            if (object) {
              return new Response(object.body as any, {
                headers: {
                  'Content-Type': result.metadata!.mimeType,
                  'Content-Length': result.metadata!.size.toString(),
                  'Access-Control-Allow-Origin': '*'
                },
              });
            }
          } else if (path.startsWith('/url/') && request.method === 'GET') {
            const fileId = path.split('/')[2];
            const expiresIn = parseInt(url.searchParams.get('expiresIn') || '3600');
            const result = await storage.getFileUrl(fileId, userId, expiresIn);
            
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
      }
    } catch (error: any) {
      console.error('Storage service error:', error);
      return Response.json({ error: error.message }, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return Response.json({ error: 'Not found' }, {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};