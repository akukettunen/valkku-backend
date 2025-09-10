import { getUserByAuth0Id, getUserTeams } from "@/db/user";
import { User, PublicUser } from "@/types/user"
import { Team } from "@/types/team";
import { Request } from "express";

// When ever user is returned by this API, we should use this function to get the public user
export async function getPublicUserByAuth0Id(req: Request) {
  const auth0Id = req.auth0Id!;
  const currentTeamIdString = req.headers['x-current-team-id'] as string | undefined;
  const currentTeamId = currentTeamIdString ? parseInt(currentTeamIdString) : undefined;

  const users = await getUserByAuth0Id(auth0Id) as User[];

  if(users.length === 0) {
    return null;
  }

  const user = users[0] as User;

  const teams = await getUserTeams(user.id) as Team[];

  let newCurrentTeamId;
  if(!teams.length) newCurrentTeamId = null;
  else if(!!teams.find(team => team.id === currentTeamId)) newCurrentTeamId = currentTeamId!;
  else newCurrentTeamId = teams[0]!.id || null;

  const publicUser: PublicUser = {
    ...user,
    teams,
    currentTeamId: newCurrentTeamId
  };

  return publicUser;
}