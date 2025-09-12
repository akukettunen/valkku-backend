/*
Roles:
Team:
- teamOwner
- teamAdmin
- teamMember
- teamGuardian
- teamAthlete
- coach

Individual:
- self
- guardian
*/

export default {
  "team": { // actions regarding the team
    "team:delete": ["owner"],
    "team:read":  ["owner","admin", "athlete"],
    "team:update": ["owner", "admin"],
    "team:invite": ["owner", "admin"],
    "team:leave": ["owner", "admin", "athlete", "guardian"],
    "membership:remove": ["owner", "admin"], // owner membership cannot be removed
    "membership:read": ["owner", "admin", "coach"],
    "team:transfer_ownership": ["owner"],
    "event:create": ["owner", "admin", "coach"],
  },
  "individual": { // actions regarding ones own stuff
    "event:create": [ "athlete", "guardian"], // create event for self or guarded athlete
    "event:read": [ "athlete", "guardian"],
    "event:update": [ "athlete", "guardian"],
    "event:remove": [ "athlete", "guardian"],
    "membership:remove": ["athlete"],
  }
}