import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app'

// Bypass auth for route tests
vi.mock('@/middleware/auth', () => ({
  requireSignedIn: (_req: any, _res: any, next: any) => { _req.user = { sub: 'u-admin' }; next() },
  requireScope: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('@/db/team', () => ({
  getTeamUserRoles: vi.fn(),
  deleteTeamUserRole: vi.fn(),
  createTeamUserRole: vi.fn(),
  getTeamUser: vi.fn(),
}))

vi.mock('@/db/user', () => ({
  getUserById: vi.fn(),
}))

import { getTeamUserRoles, deleteTeamUserRole, createTeamUserRole, getTeamUser } from '@/db/team'
import { getUserById } from '@/db/user'

const TEAM_ID = 'team1'
const USER_ID = 'user1'

describe('PATCH /api/team/:teamId/user/:userId/role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTeamUserRoles).mockResolvedValue([] as any)
    vi.mocked(getTeamUser).mockResolvedValue([{ teamId: TEAM_ID, userId: USER_ID }] as any)
    vi.mocked(getUserById).mockResolvedValue([{ id: USER_ID }] as any)
  })

  const url = (teamId = TEAM_ID, userId = USER_ID) => `/api/team/${teamId}/user/${userId}/role`

  it('creates roles that are missing and deletes roles not present', async () => {
    // Existing roles in DB
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'coach', guardianOf: null },
      { role: 'guardian', guardianOf: 'ath1' },
    ] as any)

    const body = [
      { role: 'admin' },               // to be created
      { role: 'guardian', guardianOf: 'ath2' }, // to be created
      // 'coach' removed
      // guardian of ath1 removed
    ]

    const res = await request(app).patch(url()).send(body)

    expect(res.status).toBe(200)
    expect(res.body.code).toBe('team_user_role_updated_successfully')

    // Deletions
    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'coach', null)
    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'guardian', 'ath1')

    // Creations
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'admin', undefined)
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'guardian', 'ath2')
  })

  it('no-op when roles array equals existing roles', async () => {
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'coach', guardianOf: null },
      { role: 'guardian', guardianOf: 'ath1' },
    ] as any)

    const body = [
      { role: 'coach' },
      { role: 'guardian', guardianOf: 'ath1' },
    ]

    const res = await request(app).patch(url()).send(body)

    expect(res.status).toBe(200)
    expect(deleteTeamUserRole).not.toHaveBeenCalled()
    expect(createTeamUserRole).not.toHaveBeenCalled()
  })

  it('validates guardian: guardian role must include guardianOf; non-guardian must not include guardianOf', async () => {
    // Missing guardianOf for guardian
    const res1 = await request(app).patch(url()).send([
      { role: 'guardian' as const },
    ])
    expect(res1.status).toBe(422)

    // guardianOf present for non-guardian
    const res2 = await request(app).patch(url()).send([
      { role: 'coach' as const, guardianOf: 'x' },
    ])
    expect(res2.status).toBe(422)
  })

  it('400 when roles array is empty', async () => {
    const res = await request(app).patch(url()).send([])
    expect(res.status).toBe(400)
  })

  it('400 when body is not an array', async () => {
    const res = await request(app).patch(url()).send({ role: 'coach' })
    expect(res.status).toBe(400)
  })

  it('handles create/delete mixes correctly with multiple guardians', async () => {
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([
      { role: 'admin', guardianOf: null },
      { role: 'guardian', guardianOf: 'ath1' },
      { role: 'guardian', guardianOf: 'ath2' },
    ] as any)

    const body = [
      { role: 'admin' }, // keep
      { role: 'guardian', guardianOf: 'ath3' }, // create
      // remove guardian ath1 and ath2
    ]

    const res = await request(app).patch(url()).send(body)
    expect(res.status).toBe(200)

    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'guardian', 'ath1')
    expect(deleteTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'guardian', 'ath2')
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, USER_ID, 'guardian', 'ath3')
  })

  it('400 for missing teamId or userId params', async () => {
    const res = await request(app).patch(`/api/team//user/${USER_ID}/role`).send([{ role: 'coach' }])
    expect(res.status).toBe(404) // Express will 404 unknown route
  })
})
