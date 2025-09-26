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
    "membership:create": ["owner", "admin"],
    "membership:read": ["owner", "admin", "coach"],
    "membership:delete": ["owner", "admin"], // owner membership cannot be removed
    "team:transfer_ownership": ["owner"],
    "event:create": ["owner", "admin", "coach"],
    "ownership:transfer": ["owner"],
  },
  "individual": { // actions regarding ones own stuff
    "event:create": [ "self", "guardian-as-athlete"], // create event for self or guarded athlete
    "event:read": [ "self", "guardian-as-athlete"],
    "event:update": [ "self", "guardian-as-athlete"],
    "event:delete": [ "self", "guardian-as-athlete"],
    "membership:delete": ["self"],
    "event:attendance:set": ["self", "guardian-as-athlete", "coach-as-athlete"],
    "event:attendance:read": ["self", "guardian-as-athlete", "coach-as-athlete"],
    "event:attendance:delete": ["self", "guardian-as-athlete", "coach-as-athlete"],
  }
} as const;