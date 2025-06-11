import { router } from './router'

window.addEventListener('DOMContentLoaded', () => {
	document.body.addEventListener('click', (e) => {
		const target = e.target as HTMLAnchorElement
		if (target.matches('[data-link]')) {
			e.preventDefault()
			history.pushState(null, '', target.href)
			router()
		}
	})

	window.addEventListener('popstate', router)

	router()
})
