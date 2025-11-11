import { Router, Request, Response } from 'express';
import { AppError } from '@/middleware/errors';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope, validateBasedOnScope } from '@/middleware/auth';
import { createFolderSchema, updateFolderSchema, updateFolderPositionsSchema } from '@/schemas/folder';
import { sequelize } from '@/db/index';
import { QueryTypes } from 'sequelize';

const router: Router = Router();

// GET /api/folder/team/:teamId - Get all folders for a team
router.get('/team/:teamId', requireSignedIn, requireScope('folder:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params;

  const folders = await sequelize.query(
    `SELECT * FROM folder WHERE teamId = ? ORDER BY position ASC, createdAt ASC`,
    {
      replacements: [teamId],
      type: QueryTypes.SELECT
    }
  );

  res.json(folders);
});

// GET /api/folder/:folderId/team/:teamId - Get a specific folder
router.get('/:folderId/team/:teamId', requireSignedIn, requireScope('folder:read', 'team'), async (req: Request, res: Response) => {
  const { folderId, teamId } = req.params;

  const folders = await sequelize.query(
    `SELECT * FROM folder WHERE id = ? AND teamId = ?`,
    {
      replacements: [folderId, teamId],
      type: QueryTypes.SELECT
    }
  ) as any[];

  if (!folders || folders.length === 0) {
    throw new AppError('Folder not found', 404);
  }

  res.json(folders[0]);
});

// POST /api/folder - Create a new folder
router.post('/', requireSignedIn, validate(createFolderSchema), validateBasedOnScope('folder:create'), async (req: Request, res: Response) => {
  const { name, folderType, position, teamId, parentId } = req.body;

  // If parentId is provided, verify it exists and belongs to the same team
  if (parentId) {
    const parentFolder = await sequelize.query(
      `SELECT * FROM folder WHERE id = ? AND teamId = ?`,
      {
        replacements: [parentId, teamId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (!parentFolder || parentFolder.length === 0) {
      throw new AppError('Parent folder not found', 404);
    }
  }

  const result = await sequelize.query(
    `INSERT INTO folder (name, folderType, position, teamId, parentId) VALUES (?, ?, ?, ?, ?)`,
    {
      replacements: [name, folderType, position, teamId, parentId || null],
      type: QueryTypes.INSERT
    }
  );

  const insertId = result[0];

  const newFolder = await sequelize.query(
    `SELECT * FROM folder WHERE id = ?`,
    {
      replacements: [insertId],
      type: QueryTypes.SELECT
    }
  ) as any[];

  res.status(201).json(newFolder[0]);
});

// PUT /api/folder/:folderId/team/:teamId - Update a folder
router.put('/:folderId/team/:teamId', requireSignedIn, requireScope('folder:update', 'team'), validate(updateFolderSchema), async (req: Request, res: Response) => {
  const { folderId, teamId } = req.params;
  const { name, folderType, position, parentId } = req.body;

  // Check if folder exists and belongs to this team
  const folders = await sequelize.query(
    `SELECT * FROM folder WHERE id = ? AND teamId = ?`,
    {
      replacements: [folderId, teamId],
      type: QueryTypes.SELECT
    }
  ) as any[];

  if (!folders || folders.length === 0) {
    throw new AppError('Folder not found', 404);
  }

  // If parentId is provided, verify it exists and belongs to the same team
  if (parentId) {
    const parentFolder = await sequelize.query(
      `SELECT * FROM folder WHERE id = ? AND teamId = ?`,
      {
        replacements: [parentId, teamId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (!parentFolder || parentFolder.length === 0) {
      throw new AppError('Parent folder not found', 404);
    }

    // Prevent circular references
    if (String(parentId) === String(folderId)) {
      throw new AppError('A folder cannot be its own parent', 400);
    }
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (folderType !== undefined) {
    updates.push('folderType = ?');
    values.push(folderType);
  }
  if (position !== undefined) {
    updates.push('position = ?');
    values.push(position);
  }
  if (parentId !== undefined) {
    updates.push('parentId = ?');
    values.push(parentId);
  }

  if (updates.length === 0) {
    // No updates to perform, just return the folder
    res.json(folders[0]);
    return;
  }

  values.push(folderId, teamId);

  await sequelize.query(
    `UPDATE folder SET ${updates.join(', ')} WHERE id = ? AND teamId = ?`,
    {
      replacements: values,
      type: QueryTypes.UPDATE
    }
  );

  const updatedFolder = await sequelize.query(
    `SELECT * FROM folder WHERE id = ?`,
    {
      replacements: [folderId],
      type: QueryTypes.SELECT
    }
  ) as any[];

  res.json(updatedFolder[0]);
});

// PATCH /api/folder/positions/team/:teamId - Bulk update folder positions
router.patch('/positions/team/:teamId', requireSignedIn, requireScope('folder:update', 'team'), validate(updateFolderPositionsSchema), async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { positions } = req.body;

  await sequelize.transaction(async (t) => {
    for (const { id, position } of positions) {
      await sequelize.query(
        `UPDATE folder SET position = ? WHERE id = ? AND teamId = ?`,
        {
          replacements: [position, id, teamId],
          type: QueryTypes.UPDATE,
          transaction: t
        }
      );
    }
  });

  res.json({ message: 'Positions updated successfully' });
});

// DELETE /api/folder/:folderId/team/:teamId - Delete a folder
router.delete('/:folderId/team/:teamId', requireSignedIn, requireScope('folder:delete', 'team'), async (req: Request, res: Response) => {
  const { folderId, teamId } = req.params;

  // Check if folder exists and belongs to this team
  const folders = await sequelize.query(
    `SELECT * FROM folder WHERE id = ? AND teamId = ?`,
    {
      replacements: [folderId, teamId],
      type: QueryTypes.SELECT
    }
  ) as any[];

  if (!folders || folders.length === 0) {
    throw new AppError('Folder not found', 404);
  }

  // Delete the folder (cascade will handle children)
  await sequelize.query(
    `DELETE FROM folder WHERE id = ? AND teamId = ?`,
    {
      replacements: [folderId, teamId],
      type: QueryTypes.DELETE
    }
  );

  res.json({ message: 'Folder deleted successfully' });
});

export default router;
