import { login } from '../services/user-service'

// Example: src/views/login.ts
export async function renderLogin(): Promise<string> {
	const response = await fetch('/html/login.html');
	return await response.text();
}

// Attach event listener after rendering
export function attachLoginEvents() {
	const form = document.getElementById('loginForm')
	if (form) {
		form.addEventListener('submit', async function (event) {
			event.preventDefault()
			const username = (document.getElementById('username') as HTMLInputElement).value
			const password = (document.getElementById('password') as HTMLInputElement).value
			const errorDiv = document.getElementById('loginError')

			try {
				const response = await login({ username, password })
				console.log('Login successful:', response.data)
				// After successful login
				const token = response.data.token; // Adjust if your API returns a different structure
				localStorage.setItem('authToken', token);
				window.location.href = '/'
			} catch (error: any) {
				console.error('Login failed:', error.message)
				if (errorDiv) errorDiv.textContent = 'Login failed. Please check your credentials.'
			}
		})
	}
}