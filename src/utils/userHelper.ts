import { getUserTeams, getUserById, getUserTeamRoles } from "@/db/user";
import { User, PublicUser, PublicUserSelf } from "@/types/user"
import { TeamUser, TeamUserRole, PublicTeamUser } from "@/types/team";
import { customAlphabet } from 'nanoid';

export function createId(len?: number): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, len || 12);

  return nanoid();
}

export function createPassword(): string {
  const alphabet = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 10);

  return nanoid();
}

export async function getPublicUserSelfByIdSimple(id: string) {
  const [ user ] = await getUserById(id) as User[];

  if(!user) {
    return null;
  }

  const publicUser: PublicUserSelf = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    pendingDetails: user.pendingDetails,
    preferredLanguage: user.preferredLanguage,
    superAdmin: user.superAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    status: user.status,
    emojiClickedCount: user.emojiClickedCount,
    forcePasswordChange: user.forcePasswordChange,
    teams: [],
  };

  return publicUser;
}

export async function getPublicUserSelfById(id: string, currentTeamId: string | null) {
  const [ user ] = await getUserById(id) as User[];

  if(!user) {
    return null;
  }

  const teams = await getUserTeams(user.id) as TeamUser[];
  const allTeamRoles = await getUserTeamRoles(user.id) as TeamUserRole[];
  const publicTeams = teams.map(team => {
    const roles = allTeamRoles.filter(role => role.teamId === team.teamId);
    return {
      ...team,
      roles
    };
  }) as PublicTeamUser[];

  let newCurrentTeamId;
  if(!publicTeams.length) newCurrentTeamId = null;
  else if(!!publicTeams.find(team => team.teamId === currentTeamId)) newCurrentTeamId = currentTeamId!;
  else newCurrentTeamId = publicTeams[0]!.teamId || null;

  const publicUser: PublicUserSelf = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    pendingDetails: user.pendingDetails,
    emojiClickedCount: user.emojiClickedCount,
    preferredLanguage: user.preferredLanguage,
    superAdmin: user.superAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    teams: publicTeams,
    status: user.status,
    forcePasswordChange: user.forcePasswordChange
  };

  return publicUser;
}