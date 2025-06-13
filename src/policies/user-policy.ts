
// src/policies/user-policy.ts
export const canViewUser = (user: any, req: any) => {
  const username = req.params.username;
  return user?.role === 'admin' || user.username === username;
};

export const canListUsers = (user: any) => {
  console.log("user trying to list all users: ", user);
  return user?.role === 'admin' || user.username === "bene";
};