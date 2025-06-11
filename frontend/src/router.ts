import { renderHome } from './views/home'
import { renderAbout } from './views/about'
import { renderContact } from './views/contact'

export function router() {
	const app = document.getElementById('app')!
	const path = window.location.pathname

	switch (path) {
		case '/about':
			app.innerHTML = renderAbout()
			break
		case '/contact':
			app.innerHTML = renderContact()
			break
		case '/':
		default:
			app.innerHTML = renderHome()
	}
}
