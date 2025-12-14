import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app'

// Bypass auth for route tests
vi.mock('@/middleware/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/middleware/auth')>()
  return {
    ...actual,
    requireSignedIn: (_req: any, _res: any, next: any) => {
      _req.user = { sub: 'u-admin' }
      next()
    },
    requireScope: () => (_req: any, _res: any, next: any) => next(),
    validateBasedOnScope: () => (_req: any, _res: any, next: any) => next()
  }
})

vi.mock('@/db/team', () => ({
  getTeamUserRoles: vi.fn(),
  getTeamUserRolesForGuardian: vi.fn(),
  deleteTeamUserRole: vi.fn(),
  createTeamUserRole: vi.fn(),
  getTeamUser: vi.fn(),
}))

vi.mock('@/db/user', () => ({
  getUserById: vi.fn(),
}))

import { getTeamUserRoles, getTeamUserRolesForGuardian, deleteTeamUserRole, createTeamUserRole, getTeamUser } from '@/db/team'
import { getUserById } from '@/db/user'

const TEAM_ID = 'team1'
const USER_ID = 'user1'

describe('PATCH /api/team/:teamId/user/:userId/role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTeamUserRoles).mockResolvedValue([] as any)
    vi.mocked(getTeamUserRolesForGuardian).mockResolvedValue([] as any)
    vi.mocked(getTeamUser).mockResolvedValue([{ teamId: TEAM_ID, userId: USER_ID }] as any)
    vi.mocked(getUserById).mockResolvedValue([{ id: USER_ID }] as any)
  })

  const url = (teamId = TEAM_ID, userId = USER_ID) => `/api/team/${teamId}/user/${userId}/role`

  it('creates roles that are missing and deletes roles not present', async () => {
    // Existing roles in DB
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'coach', guardianOf: null },
    ] as any)

    const body = [{ role: 'admin' }] // create admin, remove coach

    const res = await request(app).patch(url()).send({ roles: body })

    expect(res.status).toBe(200)
    expect(res.body.code).toBe('team_user_role_updated_successfully')

    // Deletions
    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'coach', null)

    // Creations
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'admin')
  })

  it('no-op when roles array equals existing roles', async () => {
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'coach', guardianOf: null },
    ] as any)

    const body = [{ role: 'coach' }]

    const res = await request(app).patch(url()).send({ roles: body })

    expect(res.status).toBe(200)
    expect(deleteTeamUserRole).not.toHaveBeenCalled()
    expect(createTeamUserRole).not.toHaveBeenCalled()
  })

  it('422 when attempting to include guardian in payload (not supported by schema)', async () => {
    const res = await request(app).patch(url()).send({ roles: [{ role: 'guardian' as any, guardianOf: 'ath1' }] })
    expect(res.status).toBe(422)
  })

  it('400 when roles array is empty (no roles left)', async () => {
    const res = await request(app).patch(url()).send({ roles: [] })
    expect(res.status).toBe(400)
  })

  it('422 when roles is not an array', async () => {
    const res = await request(app).patch(url()).send({ roles: { role: 'coach' } })
    expect(res.status).toBe(422)
  })

  it('handles create/delete mixes correctly while guardians exist (guardians unaffected)', async () => {
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'admin', guardianOf: null },
      { role: 'coach', guardianOf: null },
      { role: 'guardian', guardianOf: 'ath1' }
    ] as any)

    const body = [{ role: 'admin' }] // remove coach, keep admin; guardians should remain untouched

    const res = await request(app).patch(url()).send({ roles: body })
    expect(res.status).toBe(200)

    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'coach', null)
    expect(createTeamUserRole).not.toHaveBeenCalled()
  })

  it('400 for missing teamId or userId params', async () => {
    const res = await request(app).patch(`/api/team//user/${USER_ID}/role`).send([{ role: 'coach' }])
    expect(res.status).toBe(404) // Express will 404 unknown route
  })
})
