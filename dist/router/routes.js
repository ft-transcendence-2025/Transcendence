import { renderHome } from "../views/home.js";
import { openLoginModal } from "../components/loginModal.js";
import { openRegisterModal } from "../components/registerModal.js";
import { renderUserList } from "../views/userList.js";
import { renderDashboard } from "../views/dashboard.js";
import { renderPong } from "../views/localPong.js";
import { renderTournament } from "../views/localTournament.js";
export const routes = [
    { path: "/", action: renderHome },
    { path: "/users", action: renderUserList },
    { path: "/register", action: openRegisterModal },
    { path: "/login", action: openLoginModal },
    { path: "/dashboard", action: renderDashboard },
    { path: "/pong", action: renderPong },
    { path: "/local-tournament", action: renderTournament },
];
