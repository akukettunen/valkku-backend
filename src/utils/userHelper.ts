import { getUserTeams, getUserById, getUserTeamRoles } from "@/db/user";
import { User, PublicUser } from "@/types/user"
import { TeamUser, TeamUserRole, PublicTeamUser } from "@/types/team";
import { customAlphabet } from 'nanoid';

export function createId(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 12);

  return nanoid();
}

export function createPassword(): string {
  const alphabet = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz';
  const nanoid = customAlphabet(alphabet, 10);

  return nanoid();
}

export async function getPublicUserById(id: string, currentTeamId: string | null) {
  const [ user ] = await getUserById(id) as User[];

  if(!user) {
    return null;
  }

  console.log("Get public user by id", user.email)

  const teams = await getUserTeams(user.id) as TeamUser[];
  const allTeamRoles = await getUserTeamRoles(user.id) as TeamUserRole[];
  console.log("allTeamRoles", allTeamRoles)
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

  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    pendingDetails: user.pendingDetails,
    emojiClickedCount: user.emojiClickedCount,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    teams: publicTeams,
    status: user.status,
    forcePasswordChange: user.forcePasswordChange
  };

  return publicUser;
}