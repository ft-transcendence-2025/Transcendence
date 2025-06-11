// src/policies/user-policy.ts
export const canViewUser = (user: any, req: any) => {
  const id = req.params.id;
  return user.role === 'admin' || user.id === id;
};

export const canListUsers = (user: any) => {
  return user.role === 'admin';
};