import { renderHome } from "../views/home.js";
import { openLoginModal } from "../components/loginModal.js";
import { renderRegister } from "../views/register.js";
import { renderUserList } from "../views/userList.js";
import { renderDashboard } from "../views/dashboard.js";
import { renderPong } from "../views/pong.js";

interface Route {
  path: string;
  action: (container: HTMLElement | null) => Promise<void>;
}

export const routes: Route[] = [
  { path: "/", action: renderHome },
  { path: "/users", action: renderUserList },
  { path: "/register", action: renderRegister },
  {
    path: "/login",
    action: async () => {
      openLoginModal();
    },
  },
  { path: "/dashboard", action: renderDashboard },
  { path: "/pong", action: renderPong },
];
