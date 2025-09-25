import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app'

// Bypass auth middleware for these route tests
vi.mock('@/middleware/auth', () => ({
  requireSignedIn: (_req: any, _res: any, next: any) => { _req.user = { sub: 'inviter123' }; next() },
  requireScope: () => (_req: any, _res: any, next: any) => next(),
}))

// Mock DB: team
vi.mock('@/db/team', () => ({
  getTeamById: vi.fn(),
  getTeamUser: vi.fn(),
  getTeamUserRoles: vi.fn(),
  createTeamUser: vi.fn(),
  createTeamUserRole: vi.fn(),
  getTeamUsers: vi.fn(),
  getTeamTeamUserRoles: vi.fn(),
}))

// Mock DB: user
vi.mock('@/db/user', () => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}))

// Mock helpers related to invites
vi.mock('@/utils/teamHelper', () => ({
  userCanBeInvited: vi.fn(),
  inviteUserToTeam: vi.fn(),
}))

import { getTeamById, getTeamUser, getTeamUserRoles, createTeamUser, createTeamUserRole } from '@/db/team'
import { getUserByEmail, createUser } from '@/db/user'
import { userCanBeInvited, inviteUserToTeam } from '@/utils/teamHelper'

const TEAM_ID = 'team123'

describe('POST /api/team/:teamId/invite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTeamById).mockResolvedValue([{ id: TEAM_ID, name: 'Team' }] as any)
  })

  const url = (teamId = TEAM_ID) => `/api/team/${teamId}/invite`

  it('invites a new non-guardian user: creates user, invite, and role', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: true,
      userTeamToBeCreated: true,
    } as any)

    const res = await request(app)
      .post(url())
      .send({
        email: 'new@example.com',
        role: 'athlete',
        guardians: [],
        preferredLanguage: 'en',
      })

    expect(res.status).toBe(201)
    // createUser called once with provided email
    expect(createUser).toHaveBeenCalledTimes(1)
    const createdId = vi.mocked(createUser).mock.calls[0][0].id
    expect(vi.mocked(inviteUserToTeam)).toHaveBeenCalledWith(createdId, TEAM_ID, 'inviter123')
    expect(vi.mocked(createTeamUserRole)).toHaveBeenCalledWith(TEAM_ID, createdId, 'athlete', undefined)
  })

  it('invites an existing non-guardian user not in team: no createUser, invite + role', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: true,
      publicUser: { id: 'u1' },
    } as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'exists@example.com', role: 'coach', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(201)
    expect(createUser).not.toHaveBeenCalled()
    expect(inviteUserToTeam).toHaveBeenCalledWith('u1', TEAM_ID, 'inviter123')
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, 'u1', 'coach', undefined)
  })

  it('rejects when non-guardian cannot be invited (already in team with role)', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: false,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'u1' },
    } as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'exists@example.com', role: 'coach', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('user_already_invited_to_team_with_role')
    expect(createUser).not.toHaveBeenCalled()
    expect(inviteUserToTeam).not.toHaveBeenCalled()
    expect(createTeamUserRole).not.toHaveBeenCalled()
  })

  it('adds guardian for existing user: no invite, ensures membership, adds guardian role', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'g1' },
    } as any)
    // Not yet in team
    vi.mocked(getTeamUser).mockResolvedValueOnce([] as any)
    // No duplicate guardian role yet
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([] as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'guardian@example.com', role: 'guardian', guardianOf: 'ath1', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(201)
    expect(createTeamUser).toHaveBeenCalledWith(TEAM_ID, 'g1')
    expect(inviteUserToTeam).not.toHaveBeenCalled()
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, 'g1', 'guardian', 'ath1')
  })

  it('does not duplicate membership for existing guardian already in team', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'g1' },
    } as any)
    // Already in team
    vi.mocked(getTeamUser).mockResolvedValueOnce([{ teamId: TEAM_ID, userId: 'g1' }] as any)
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([] as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'guardian@example.com', role: 'guardian', guardianOf: 'ath1', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(201)
    expect(createTeamUser).not.toHaveBeenCalled()
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, 'g1', 'guardian', 'ath1')
  })

  it('blocks self-guardian when main role is guardian', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'ath1' },
    } as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'x@example.com', role: 'guardian', guardianOf: 'ath1', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('invalid_guardian_relationship')
    expect(createTeamUserRole).not.toHaveBeenCalled()
  })

  it('guardian array: existing guardian gets membership+role, new guardian gets created+invited+role', async () => {
    // Main invited user is existing athlete already in team
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'ath1' },
    } as any)

    // Guardian lookup by email
    vi.mocked(getUserByEmail).mockImplementation(async (email: string) => {
      if (email === 'g1@example.com') return [{ id: 'g1' }] as any
      if (email === 'g2@example.com') return [] as any
      return [] as any
    })

    // g1 not in team yet, no duplicate role
    vi.mocked(getTeamUser).mockResolvedValueOnce([] as any) // g1 membership
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([] as any) // g1 roles

    const res = await request(app)
      .post(url())
      .send({
        email: 'ath@example.com',
        role: 'athlete',
        guardians: [
          { email: 'g1@example.com', preferredLanguage: 'en' },
          { email: 'g2@example.com', preferredLanguage: 'en' },
        ],
        preferredLanguage: 'en',
      })

    expect(res.status).toBe(201)

    // g1 (existing): ensure membership + role, no invite
    expect(createTeamUser).toHaveBeenCalledWith(TEAM_ID, 'g1')
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, 'g1', 'guardian', 'ath1')

    // g2 (new): create + invite + role
    const createdG2Id = vi.mocked(createUser).mock.calls.find(([args]) => args.email === 'g2@example.com')?.[0]?.id
    expect(createdG2Id).toBeTruthy()
    expect(inviteUserToTeam).toHaveBeenCalledWith(createdG2Id, TEAM_ID, 'inviter123')
    expect(createTeamUserRole).toHaveBeenCalledWith(TEAM_ID, createdG2Id, 'guardian', 'ath1')
  })

  it('rejects duplicate guardian emails in array', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'ath1' },
    } as any)

    const res = await request(app)
      .post(url())
      .send({
        email: 'ath@example.com',
        role: 'athlete',
        guardians: [
          { email: 'dup@example.com', preferredLanguage: 'en' },
          { email: 'dup@example.com', preferredLanguage: 'en' },
        ],
        preferredLanguage: 'en',
      })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('guardians_must_be_unique')
  })

  it('rejects when team not found', async () => {
    vi.mocked(getTeamById).mockResolvedValue([] as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'x@example.com', role: 'coach', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(404)
  })

  it('blocks duplicate guardian relationship for main guardian flow', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'g1' },
    } as any)

    // membership exists, role duplicate exists
    vi.mocked(getTeamUser).mockResolvedValueOnce([{ teamId: TEAM_ID, userId: 'g1' }] as any)
    vi.mocked(getTeamUserRoles).mockResolvedValueOnce([{ role: 'guardian', guardianOf: 'ath1' }] as any)

    const res = await request(app)
      .post(url())
      .send({ email: 'guardian@example.com', role: 'guardian', guardianOf: 'ath1', guardians: [], preferredLanguage: 'en' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('guardian_already_invited_to_team_for_this_user')
  })

  // Validation tests (schema-driven, expect 422)
  it('422 when missing email', async () => {
    const res = await request(app)
      .post(url())
      .send({ role: 'coach', guardians: [], preferredLanguage: 'en' })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('validation_error')
  })

  it('422 when invalid email format', async () => {
    const res = await request(app)
      .post(url())
      .send({ email: 'not-an-email', role: 'coach', guardians: [], preferredLanguage: 'en' })
    expect(res.status).toBe(422)
  })

  it('422 when missing preferredLanguage', async () => {
    const res = await request(app)
      .post(url())
      .send({ email: 'x@example.com', role: 'coach', guardians: [] })
    expect(res.status).toBe(422)
  })

  it("422 when guardians provided but role isn't athlete", async () => {
    const res = await request(app)
      .post(url())
      .send({
        email: 'x@example.com',
        role: 'coach',
        guardians: [{ email: 'g@example.com', preferredLanguage: 'en' }],
        preferredLanguage: 'en',
      })
    expect(res.status).toBe(422)
  })

  it('422 when role guardian but missing guardianOf', async () => {
    const res = await request(app)
      .post(url())
      .send({ email: 'g@example.com', role: 'guardian', preferredLanguage: 'en' })
    expect(res.status).toBe(422)
  })

  it("422 when guardianOf provided but role isn't guardian", async () => {
    const res = await request(app)
      .post(url())
      .send({ email: 'x@example.com', role: 'coach', guardianOf: 'ath1', preferredLanguage: 'en' })
    expect(res.status).toBe(422)
  })

  it('422 when guardians item missing both email and userId', async () => {
    const res = await request(app)
      .post(url())
      .send({
        email: 'x@example.com',
        role: 'athlete',
        guardians: [{ preferredLanguage: 'en' }],
        preferredLanguage: 'en',
      })
    expect(res.status).toBe(422)
  })

  it('422 when more than 6 guardians are provided', async () => {
    const guardians = Array.from({ length: 7 }).map((_, i) => ({ email: `g${i}@ex.com`, preferredLanguage: 'en' }))
    const res = await request(app)
      .post(url())
      .send({ email: 'ath@example.com', role: 'athlete', guardians, preferredLanguage: 'en' })
    expect(res.status).toBe(422)
  })

  it('400 when guardians array contains same email as main user', async () => {
    const res = await request(app)
      .post(url())
      .send({
        email: 'same@example.com',
        role: 'athlete',
        guardians: [{ email: 'same@example.com', preferredLanguage: 'en' }],
        preferredLanguage: 'en',
      })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('guardian_cannot_be_the_same_as_the_user')
  })

  it('400 when existing guardian in array already has guardian role for target', async () => {
    vi.mocked(userCanBeInvited).mockResolvedValue({
      canBeInvited: true,
      userToBeCreated: false,
      userTeamToBeCreated: false,
      publicUser: { id: 'ath1' },
    } as any)

    vi.mocked(getUserByEmail).mockResolvedValue([{ id: 'g1' }] as any)
    vi.mocked(getTeamUser).mockResolvedValue([{ teamId: TEAM_ID, userId: 'g1' }] as any)
    vi.mocked(getTeamUserRoles).mockResolvedValue([{ role: 'guardian', guardianOf: 'ath1' }] as any)

    const res = await request(app)
      .post(url())
      .send({
        email: 'ath@example.com',
        role: 'athlete',
        guardians: [{ email: 'g1@example.com', preferredLanguage: 'en' }],
        preferredLanguage: 'en',
      })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('guardian_already_invited_to_team_for_this_user')
  })
})
