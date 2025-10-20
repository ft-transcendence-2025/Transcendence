export const friendshipRules = [
  {
    match: (method: string, hasUsername: boolean) =>
      method === "GET" && !hasUsername,
    needsAuth: true,
  },
  {
    match: (method: string, hasUsername: boolean) =>
      method === "GET" && hasUsername,
    needsAuth: true,
  },
  {
    match: (method: string) => method === "PATCH",
    needsAuth: true,
  },
  {
    match: (method: string) => method === "PUT",
    needsAuth: true,
  },
  {
    match: (method: string) => method === "DELETE",
    needsAuth: true,
    policyFn: async (req: any, res: any) => true,
  },
  {
    match: (method: string) => method === "POST",
    needsAuth: true,
  },
];
