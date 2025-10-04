import { renderHome } from "../views/home.js";
import { render404 } from "../views/404.js";
import { openLoginModal } from "../components/login.js";
import { openRegisterModal } from "../components/register.js";
import { renderFriends } from "../views/friends.js";
import { renderDashboard } from "../views/dashboard.js";
import { renderPong } from "../views/pong.js";
import { renderTournament } from "../views/tournament/tournamentSetup.js";
import { renderRemoteTournamentLobby } from "../views/tournament/remoteTournamentLobby.js";
import { renderUserProfile } from "../views/userProfile.js";
import { renderTournamentTree } from "../views/tournament/tournamentTree.js";
import { renderStats } from "../views/stats.js";
import { renderChat } from "../views/chat.js";
import { renderProfile } from "../views/profile.js";

interface Route {
  path: string;
  action: (container: HTMLElement | null) => Promise<void>;
}

export const routes: Route[] = [
  { path: "/", action: renderHome },
  { path: "/404", action: render404 },
  { path: "/profile", action: renderUserProfile },
  { path: "/friend-profile", action: renderProfile },
  { path: "/register", action: openRegisterModal },
  { path: "/login", action: openLoginModal },
  { path: "/dashboard", action: renderDashboard },
  { path: "/pong", action: renderPong },
  { path: "/tournament", action: renderTournament },
  { path: "/remote-tournament-lobby", action: renderRemoteTournamentLobby },
  { path: "/tournament-tree", action: renderTournamentTree },
  { path: "/stats", action: renderStats },
  { path: "/friends", action: renderFriends },
];
