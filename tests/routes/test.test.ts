import request from 'supertest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Op } from 'sequelize'

import app from '@/app'
import { models, sequelize } from '@/db/index'
import { TokenUser } from '@/types/user'

// Mock verifyToken
vi.mock('@/utils/tokenHelper', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(),
  generateRefreshToken: vi.fn()
}))

import { verifyToken } from '@/utils/tokenHelper'

const AUTH_HEADER = { Authorization: 'Bearer test-token' }

function setUser(user: TokenUser) {
  vi.mocked(verifyToken).mockResolvedValue(user)
}

function superAdmin(sub = 'super-admin'): TokenUser {
  return {
    sub,
    jti: 'jti-super',
    teams: [],
    superAdmin: true,
    forcePasswordChange: false
  }
}

function staffUser(teamId = 'team-1', sub = 'coach-1'): TokenUser {
  return {
    sub,
    jti: 'jti-staff',
    superAdmin: false,
    forcePasswordChange: false,
    teams: [
      {
        teamId,
        roles: [{ role: 'coach' }]
      }
    ]
  }
}

function athleteUser(teamId = 'team-1', sub = 'athlete-1'): TokenUser {
  return {
    sub,
    jti: 'jti-athlete',
    superAdmin: false,
    forcePasswordChange: false,
    teams: [
      {
        teamId,
        roles: [{ role: 'athlete' }]
      }
    ]
  }
}

function guardianUser(teamId = 'team-1', sub = 'guardian-1', wardSub = 'athlete-1'): TokenUser {
  return {
    sub,
    jti: 'jti-guardian',
    superAdmin: false,
    forcePasswordChange: false,
    teams: [
      {
        teamId,
        roles: [{ role: 'guardian', guardianOf: wardSub }]
      }
    ]
  }
}

describe('test routes (/api/test)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // auth middleware is noisy (console.log) → silence during tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /test/groups/admin (super admin only)', () => {
    it('401 if no token', async () => {
      const res = await request(app).get('/api/test/groups/admin')
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ message: 'Invalid or expired token', code: 'unauthorized' })
    })

    it('401 if invalid token', async () => {
      vi.mocked(verifyToken).mockRejectedValue(new Error('Invalid token'))
      const res = await request(app).get('/api/test/groups/admin').set(AUTH_HEADER)
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ message: 'Invalid or expired token', code: 'unauthorized' })
    })

    it('403 if not super admin', async () => {
      setUser(staffUser())
      const res = await request(app).get('/api/test/groups/admin').set(AUTH_HEADER)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
    })

    it('200 returns groups for super admin', async () => {
      setUser(superAdmin())
      const mockGroups = [{ id: 1 }, { id: 2 }]
      vi.spyOn(models.testGroups, 'findAll').mockResolvedValue(mockGroups as any)

      const res = await request(app).get('/api/test/groups/admin').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: JSON.parse(JSON.stringify(mockGroups)) })
      expect(models.testGroups.findAll).toHaveBeenCalledWith({
        where: { deletedAt: null },
        order: [['sort_order', 'ASC'], ['id', 'DESC']]
      })
    })
  })

  describe('PUT /test/groups/admin/order (super admin only)', () => {
    it('403 if not super admin', async () => {
      setUser(staffUser())
      const res = await request(app)
        .put('/api/test/groups/admin/order')
        .set(AUTH_HEADER)
        .send({ items: [{ id: 1, sort_order: 1 }] })
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
    })

    it('400 if payload is invalid', async () => {
      setUser(superAdmin())
      const res = await request(app).put('/api/test/groups/admin/order').set(AUTH_HEADER).send({})
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ code: 'validation_error', message: 'Invalid payload' })
    })

    it('200 updates sort_order for each item', async () => {
      setUser(superAdmin())
      const tx = vi.spyOn(sequelize, 'transaction').mockImplementation(async (fn: any) => fn({}))
      const upd = vi.spyOn(models.testGroups, 'update').mockResolvedValue([1] as any)

      const res = await request(app)
        .put('/api/test/groups/admin/order')
        .set(AUTH_HEADER)
        .send({ items: [{ id: 10, sort_order: 5 }, { id: 11, sort_order: 6 }] })

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, message: 'Groups reordered' })
      expect(tx).toHaveBeenCalledTimes(1)
      expect(upd).toHaveBeenCalledTimes(2)
      expect(upd).toHaveBeenCalledWith(
        { sort_order: 5 },
        expect.objectContaining({ where: { id: 10, deletedAt: null }, transaction: expect.anything() })
      )
    })
  })

  describe('GET /test/groups (signed-in)', () => {
    it('401 if no token', async () => {
      const res = await request(app).get('/api/test/groups')
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ message: 'Invalid or expired token', code: 'unauthorized' })
    })

    it('200 returns groups for any signed-in user', async () => {
      setUser(athleteUser())
      vi.spyOn(models.testGroups, 'findAll').mockResolvedValue([{ id: 1 }] as any)
      const res = await request(app).get('/api/test/groups').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(models.testGroups.findAll).toHaveBeenCalledWith({
        where: { deletedAt: null },
        order: [['sort_order', 'ASC'], ['id', 'ASC']]
      })
    })
  })

  describe('GET /test (signed-in)', () => {
    it('defaults to global tests only when no teamId is provided', async () => {
      setUser(staffUser())
      const findAll = vi.spyOn(models.tests, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })

      const args = findAll.mock.calls[0][0] as any
      expect(args.where).toEqual({ deletedAt: null, scope: 'global' })
    })

    it('includes global + team tests when teamId is provided', async () => {
      setUser(staffUser('team-1'))
      const findAll = vi.spyOn(models.tests, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const where = (findAll.mock.calls[0][0] as any).where
      expect(where.deletedAt).toBe(null)
      expect(where[Op.or]).toEqual([{ teamId: 'team-1' }, { scope: 'global' }])
    })

    it('403 when requesting tests for a team user is not in (no leak)', async () => {
      setUser(staffUser('team-1'))
      const findAll = vi.spyOn(models.tests, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test?teamId=team-2').set(AUTH_HEADER)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ success: false, message: 'Not in team' })
      expect(findAll).not.toHaveBeenCalled()
    })
  })

  describe('GET /test/:id (no leaking other teams)', () => {
    it('403 when requesting another team’s test', async () => {
      setUser(staffUser('team-1'))
      const findOne = vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 555, scope: 'team', teamId: 'team-2' })
      } as any)

      const res = await request(app).get('/api/test/555').set(AUTH_HEADER)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ success: false, message: 'Not in team' })
      expect(findOne).toHaveBeenCalled()
    })

    it('200 when requesting own team’s test', async () => {
      setUser(staffUser('team-1'))
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 556, scope: 'team', teamId: 'team-1' })
      } as any)

      const res = await request(app).get('/api/test/556').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /test/results (role-based visibility)', () => {
    it('403 when teamId is provided but user is not in that team', async () => {
      setUser({
        sub: 'u1',
        jti: 'jti',
        teams: [],
        superAdmin: false,
        forcePasswordChange: false
      })
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ success: false, message: 'Not in team' })
      expect(findAll).not.toHaveBeenCalled()
    })

    it('staff in team can see all team results', async () => {
      setUser(staffUser('team-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })

      const where = (findAll.mock.calls[0][0] as any).where
      expect(where.teamId).toBe('team-1')
      expect(where.deletedAt).toBe(null)
      expect(where.userId).toBeUndefined()
    })

    it('athlete in team is restricted to their own results', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(200)

      const where = (findAll.mock.calls[0][0] as any).where
      expect(where.teamId).toBe('team-1')
      expect(where.userId[Op.in]).toEqual(['athlete-1'])
    })

    it('athlete querying another userId returns empty array (no data leak)', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1&userId=someone-else').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })
      expect(findAll).not.toHaveBeenCalled()
    })

    it('guardian in team can see their ward results', async () => {
      setUser(guardianUser('team-1', 'guardian-1', 'ward-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(200)

      const where = (findAll.mock.calls[0][0] as any).where
      expect(where.teamId).toBe('team-1')
      expect(where.userId[Op.in]).toEqual(['ward-1'])
    })

    it('guardian querying non-ward userId returns empty array', async () => {
      setUser(guardianUser('team-1', 'guardian-1', 'ward-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?teamId=team-1&userId=other').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })
      expect(findAll).not.toHaveBeenCalled()
    })

    it('without teamId defaults to own results only (userId mismatch returns empty)', async () => {
      setUser(staffUser('team-1', 'u-self'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app).get('/api/test/results?userId=other').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })
      expect(findAll).not.toHaveBeenCalled()
    })
  })

  describe('POST /test/results (permission to record results)', () => {
    it('403 when athlete tries to submit results for another user', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const res = await request(app)
        .post('/api/test/results')
        .set(AUTH_HEADER)
        .send({
          testId: 1,
          teamId: 'team-1',
          date: '2025-01-01',
          results: [{ userId: 'someone-else', values: [{ testFillableId: 1, value: 10 }] }]
        })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized to add results for other users' })
    })

    it('403 when user posts results into a team they are not in (no cross-team writes)', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const res = await request(app)
        .post('/api/test/results')
        .set(AUTH_HEADER)
        .send({
          testId: 1,
          teamId: 'team-2',
          date: '2025-01-01',
          results: [{ userId: 'athlete-1', values: [{ testFillableId: 1, value: 10 }] }]
        })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Not in team' })
    })
  })

  describe('DELETE /test/results/:id (scope=user safety)', () => {
    it('403 when athlete attempts to delete another user result (no data leak)', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))

      vi.spyOn(models.testResults, 'findOne').mockResolvedValue({
        get: () => ({ id: 123, userId: 'someone-else' }),
        update: vi.fn()
      } as any)
      const updateValues = vi.spyOn(models.testResultValues, 'update').mockResolvedValue([1] as any)

      const res = await request(app)
        .delete('/api/test/results/123?scope=user&teamId=team-1')
        .set(AUTH_HEADER)

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
      expect(updateValues).not.toHaveBeenCalled()
    })

    it('200 when athlete deletes their own result', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))

      const resultUpdate = vi.fn()
      vi.spyOn(models.testResults, 'findOne').mockResolvedValue({
        get: () => ({ id: 123, userId: 'athlete-1' }),
        update: resultUpdate
      } as any)
      vi.spyOn(models.testResultValues, 'update').mockResolvedValue([1] as any)

      const res = await request(app)
        .delete('/api/test/results/123?scope=user&teamId=team-1')
        .set(AUTH_HEADER)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, message: 'Result deleted' })
      expect(resultUpdate).toHaveBeenCalledWith({ deletedAt: expect.any(Date) })
    })
  })

  describe('POST /test (create team-scoped test)', () => {
    it('403 when trying to create global test via team endpoint', async () => {
      setUser(staffUser('team-1', 'coach-1'))
      const res = await request(app)
        .post('/api/test')
        .set(AUTH_HEADER)
        .send({ title: { fi: 'A', en: 'A' }, testGroupId: 1, scope: 'global', teamId: 'team-1', fillables: [] })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'forbidden', message: 'Cannot create global test' })
    })

    it('404 when teamId missing (blocked by requireScope)', async () => {
      setUser(staffUser('team-1', 'coach-1'))
      const res = await request(app)
        .post('/api/test')
        .set(AUTH_HEADER)
        .send({ title: { fi: 'A', en: 'A' }, testGroupId: 1, scope: 'team', fillables: [] })

      expect(res.status).toBe(404)
      expect(res.body).toEqual({ code: 'team_not_found', message: 'Team not found' })
    })
  })

  describe('PUT /test/:id (update team test ownership rules)', () => {
    it('403 when trying to update a global test via team route', async () => {
      setUser(staffUser('team-1', 'coach-1'))
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 5, scope: 'global' })
      } as any)

      const res = await request(app)
        .put('/api/test/5')
        .set(AUTH_HEADER)
        .send({ teamId: 'team-1', title: { fi: 'X', en: 'X' }, scope: 'team' })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'forbidden', message: 'Cannot modify global test' })
    })

    it('403 when athlete tries to update someone else’s team test', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const testUpdate = vi.fn()
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 10, scope: 'team', teamId: 'team-1', createdById: 'other-user' }),
        update: testUpdate
      } as any)

      const res = await request(app)
        .put('/api/test/10')
        .set(AUTH_HEADER)
        .send({ teamId: 'team-1', title: { fi: 'X', en: 'X' } })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized to update this test' })
      expect(testUpdate).not.toHaveBeenCalled()
    })

    it('200 when athlete updates their own team test', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const testUpdate = vi.fn()
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 11, scope: 'team', teamId: 'team-1', createdById: 'athlete-1' }),
        update: testUpdate
      } as any)

      vi.spyOn(sequelize, 'transaction').mockImplementation(async (fn: any) => fn({}))
      vi.spyOn(models.testFillables, 'update').mockResolvedValue([1] as any)
      vi.spyOn(models.testFillables, 'create').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(models.tests, 'findByPk').mockResolvedValue({ id: 11 } as any)

      const res = await request(app)
        .put('/api/test/11')
        .set(AUTH_HEADER)
        .send({
          teamId: 'team-1',
          title: { fi: 'Updated', en: 'Updated' },
          fillables: [{ unitId: 1, title: { fi: 'Arvo', en: 'Value' } }]
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('403 when owner tries to update a test for a team they are not in', async () => {
      // User is owner by createdById but does not belong to test.teamId
      setUser(athleteUser('team-1', 'athlete-1'))
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 12, scope: 'team', teamId: 'team-2', createdById: 'athlete-1' }),
        update: vi.fn()
      } as any)

      const res = await request(app)
        .put('/api/test/12')
        .set(AUTH_HEADER)
        .send({ teamId: 'team-1', title: { fi: 'X', en: 'X' } })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Not in team' })
    })
  })

  describe('DELETE /test/:id (delete team test ownership rules)', () => {
    it('403 when trying to delete a global test via team route', async () => {
      setUser(staffUser('team-1', 'coach-1'))
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 5, scope: 'global' })
      } as any)

      const res = await request(app).delete('/api/test/5').set(AUTH_HEADER).query({ teamId: 'team-1' })
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'forbidden', message: 'Cannot delete global test' })
    })

    it('403 when athlete tries to delete someone else’s team test', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const testUpdate = vi.fn()
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 20, scope: 'team', teamId: 'team-1', createdById: 'other-user' }),
        update: testUpdate
      } as any)

      const res = await request(app).delete('/api/test/20').set(AUTH_HEADER).query({ teamId: 'team-1' })
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized to delete this test' })
      expect(testUpdate).not.toHaveBeenCalled()
    })

    it('403 when owner tries to delete a test for a team they are not in', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const testUpdate = vi.fn()
      vi.spyOn(models.tests, 'findOne').mockResolvedValue({
        get: () => ({ id: 21, scope: 'team', teamId: 'team-2', createdById: 'athlete-1' }),
        update: testUpdate
      } as any)

      const res = await request(app).delete('/api/test/21').set(AUTH_HEADER).query({ teamId: 'team-1' })
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Not in team' })
      expect(testUpdate).not.toHaveBeenCalled()
    })
  })

  describe('GET /test/events (team scope read)', () => {
    it('404 team_not_found when teamId is not in token teams', async () => {
      setUser({
        sub: 'u1',
        jti: 'jti',
        teams: [],
        superAdmin: false,
        forcePasswordChange: false
      })
      const res = await request(app).get('/api/test/events?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ code: 'team_not_found', message: 'Team not found' })
    })

    it('200 for athlete in team', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      vi.spyOn(models.testEvents, 'findAll').mockResolvedValue([] as any)
      const res = await request(app).get('/api/test/events?teamId=team-1').set(AUTH_HEADER)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, data: [] })
    })
  })

  describe('POST /test/events (staff-only create)', () => {
    it('403 for athlete', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const res = await request(app)
        .post('/api/test/events')
        .set(AUTH_HEADER)
        .send({ teamId: 'team-1', date: '2025-01-01', name: 'Testipäivä', testIds: [1] })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
    })

    it('201 for coach', async () => {
      setUser(staffUser('team-1', 'coach-1'))
      vi.spyOn(sequelize, 'transaction').mockImplementation(async (fn: any) => fn({}))
      vi.spyOn(models.testEvents, 'create').mockResolvedValue({ id: 100 } as any)
      vi.spyOn(models.testEventTests, 'create').mockResolvedValue({ id: 1 } as any)

      const res = await request(app)
        .post('/api/test/events')
        .set(AUTH_HEADER)
        .send({ teamId: 'team-1', date: '2025-01-01', name: 'Testipäivä', testIds: [1, 2] })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(100)
    })
  })

  describe('DELETE /test/results/try (scope=user restricts to own)', () => {
    it('adds userId filter for scope=user', async () => {
      setUser(athleteUser('team-1', 'athlete-1'))
      const findAll = vi.spyOn(models.testResults, 'findAll').mockResolvedValue([] as any)

      const res = await request(app)
        .delete('/api/test/results/try')
        .set(AUTH_HEADER)
        .query({ testEventId: 1, testId: 2, tryOrder: 1, teamId: 'team-1', scope: 'user' })

      expect(res.status).toBe(200)
      const where = (findAll.mock.calls[0][0] as any).where
      expect(where.userId[Op.in]).toEqual(['athlete-1'])
    })
  })

  describe('GET /test/admin (super admin only)', () => {
    it('403 if not super admin', async () => {
      setUser(staffUser())
      const res = await request(app).get('/api/test/admin').set(AUTH_HEADER)
      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
    })
  })

  describe('POST /test/admin (super admin only)', () => {
    it('403 if not super admin', async () => {
      setUser(staffUser())
      const res = await request(app)
        .post('/api/test/admin')
        .set(AUTH_HEADER)
        .send({ title: { fi: 'A', en: 'A' }, testGroupId: 1, fillables: [] })

      expect(res.status).toBe(403)
      expect(res.body).toEqual({ code: 'unauthorized', message: 'Unauthorized' })
    })

    it('201 creates a global test for super admin', async () => {
      setUser(superAdmin('sa-1'))

      vi.spyOn(sequelize, 'transaction').mockImplementation(async (fn: any) => fn({}))
      vi.spyOn(models.tests, 'create').mockResolvedValue({ id: 999 } as any)
      vi.spyOn(models.testFillables, 'create').mockResolvedValue({ id: 1 } as any)
      vi.spyOn(models.tests, 'findByPk').mockResolvedValue({ id: 999, scope: 'global' } as any)

      const res = await request(app)
        .post('/api/test/admin')
        .set(AUTH_HEADER)
        .send({
          title: { fi: 'Uusi testi', en: 'New test' },
          notes: { fi: 'Muistiinpanot', en: 'Notes' },
          testGroupId: 1,
          decimals: 2,
          fillables: [{ unitId: 1, title: { fi: 'Arvot', en: 'Values' } }]
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(999)
    })
  })

  describe('DELETE /test/results/:id (scope=team for staff)', () => {
    it('200 for coach (scope=team) and performs soft delete', async () => {
      setUser(staffUser('team-1', 'coach-1'))

      const resultUpdate = vi.fn()
      vi.spyOn(models.testResults, 'findOne').mockResolvedValue({
        get: () => ({ id: 321, userId: 'athlete-1' }),
        update: resultUpdate
      } as any)
      vi.spyOn(models.testResultValues, 'update').mockResolvedValue([1] as any)

      const res = await request(app)
        .delete('/api/test/results/321')
        .set(AUTH_HEADER)
        .query({ scope: 'team', teamId: 'team-1' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true, message: 'Result deleted' })
      expect(resultUpdate).toHaveBeenCalledWith({ deletedAt: expect.any(Date) })
    })
  })
})
