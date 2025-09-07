/*
Roles:
Team:
- teamOwner
- teamAdmin
- teamMember
- teamGuardian
- teamAthlete

Individual:
- self
- guardian
*/

export default {
  team: { // actions regarding the team
    "team:delete": ["owner"],
    "team:read": ["owner","admin", "member"],
    "team:update": ["owner", "admin"],
    "event:create": ["admin", "coach"]
  },
  individual: { // actions regarding ones own stuff
    "event:create": [ "self", "guardian"],
    "event:read": [ "self", "guardian"],
    "event:update": [ "self", "guardian"],
    "event:delete": [ "self", "guardian"],
  }
}