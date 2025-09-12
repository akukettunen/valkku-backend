import { getUserTeams, getUserById } from "@/db/user";
import { User, PublicUser } from "@/types/user"
import { TeamUser } from "@/types/team";

export async function getPublicUserById(id: number, currentTeamId: number | null) {
  const [ user ] = await getUserById(id) as User[];

  if(!user) {
    return null;
  }

  const teams = await getUserTeams(user.id) as TeamUser[];

  let newCurrentTeamId;
  if(!teams.length) newCurrentTeamId = null;
  else if(!!teams.find(team => team.teamId === currentTeamId)) newCurrentTeamId = currentTeamId!;
  else newCurrentTeamId = teams[0]!.teamId || null;

  const publicUser: PublicUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    pendingDetails: user.pendingDetails,
    emojiClickedCount: user.emojiClickedCount,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    teams,
    currentTeamId: newCurrentTeamId
  };

  return publicUser;
}