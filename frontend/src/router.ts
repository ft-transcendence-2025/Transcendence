import { renderHome } from './views/home'
import { renderAbout } from './views/about'
import { renderContact } from './views/contact'
import { renderLogin, attachLoginEvents } from './views/login'
import { renderUsers, attachUsersEvents } from './views/users'

export async function router() {
    const app = document.getElementById('app')!
    const path = window.location.pathname

    switch (path) {
        case '/login':
            app.innerHTML = await renderLogin()
            attachLoginEvents()
            break
        case '/users':
            app.innerHTML = await renderUsers();
            attachUsersEvents();
            break;
        case '/':
        default:
            app.innerHTML = renderHome()
    }
}