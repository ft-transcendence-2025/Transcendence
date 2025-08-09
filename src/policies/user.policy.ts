export const canListUsers = (user: any) => /*  user.role === "admin" */ true;

export const canViewUser = (user: any, username: string) =>
  /*  user.role === "admin" */ true || user.username === username;

export const canDisableUser = (user: any) => /*  user.role === "admin" */ true;

export const canUpdateUser = (user: any) => /*  user.role === "admin" */ true;

export const canDeleteUser = (user: any) => /*  user.role === "admin" */ true;
