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
    "event:update": ["owner", "admin", "coach"],
    "event:read": ["owner", "admin", "coach", "athlete", "guardian"],

    "ownership:transfer": ["owner"],

    "plan-part-type:create": ["owner", "admin", "coach"],
    "plan-part-type:update": ["owner", "admin", "coach"],
    "plan-part-type:delete": ["owner", "admin", "coach"],

    "user:read": ["owner", "admin", "coach"],

    "plan:post": ["owner", "admin", "coach"],
    "plan:read": ["owner", "admin", "coach", "athlete", "guardian"],
    "plan:update": ["owner", "admin", "coach"],
    "plan:delete": ["owner", "admin", "coach"],

    "location:create": ["owner", "admin"],
    "location:read": ["owner", "admin", "athlete", "guardian", "coach"],
    "location:update": ["owner", "admin", "coach"],
    "location:delete": ["owner", "admin", "coach"]
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

    "plan-part-type:create": ["self", "guardian-as-athlete"],
    "plan-part-type:update": ["self", "guardian-as-athlete"],

    "plan:post": ["self", "guardian-as-athlete"],
    "plan:read": ["self", "guardian-as-athlete"],
    "plan:update": ["self", "guardian-as-athlete"],
    "plan:delete": ["self", "guardian-as-athlete"],

    "user:read": ["self", "guardian-as-athlete"],
  }
} as const;