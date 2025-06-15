import { getUsers } from '../services/user-service'

export async function renderUsers(): Promise<string> {
	const response = await fetch('/html/users.html');
	return await response.text();
}

export function attachUsersEvents() {
	const usersTableBody = document.getElementById('usersTableBody');
	const errorDiv = document.getElementById('usersError');

	if (usersTableBody) {
		getUsers()
			.then(res => {
				const users = res.data as Array<any>;
				usersTableBody.innerHTML = users.map(user => `
                    <tr>
                        <td class="border px-4 py-2">${user.username}</td>
                        <td class="border px-4 py-2">${user.email ?? ''}</td>
                        <td class="border px-4 py-2">${user.active ? 'Yes' : 'No'}</td>
                        <td class="border px-4 py-2">${new Date(user.createdAt).toLocaleString()}</td>
                    </tr>
                `).join('');
			})
			.catch(err => {
				if (errorDiv) errorDiv.textContent = 'Failed to load users.';
			});
	}
}