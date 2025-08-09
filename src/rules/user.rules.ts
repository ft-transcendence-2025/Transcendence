import * as policy from "../policies/user.policy";

export const usersRules = [
  {
    match: (method: string, hasUsername: boolean) => method === "GET" && !hasUsername,
    needsAuth: true,
    policyFn: policy.canListUsers,
  },
  {
    match: (method: string, hasUsername: boolean) => method === "GET" && hasUsername,
    needsAuth: true,
    policyFn: policy.canViewUser,
  },
  {
    match: (method: string) => method === "PATCH",
    needsAuth: true,
    policyFn: policy.canDisableUser,
  },
  {
    match: (method: string) => method === "PUT",
    needsAuth: true,
    policyFn: policy.canUpdateUser,
  },
  {
    match: (method: string) => method === "DELETE",
    needsAuth: true,
    policyFn: policy.canDeleteUser,
  },
  {
    match: (method: string) => method === "POST", // public example
    needsAuth: true,
  },
];
