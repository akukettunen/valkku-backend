import { getUserByAuth0Id, getUserTeams } from "@/db/user";
import { User, PublicUser } from "@/types/user"
import { Team } from "@/types/team";

// When ever user is returned by this API, we should use this function to get the public user
export async function getPublicUserByAuth0Id(auth0Id: string) {
  const users = await getUserByAuth0Id(auth0Id) as User[];

  if(users.length === 0) {
    return null;
  }

  const user = users[0] as User;

  const teams = await getUserTeams(user.id) as Team[];

  const publicUser: PublicUser = {
    ...user,
    teams
  };

  return publicUser;
}