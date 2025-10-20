const USER_MANAGEMENT_URL = "http://user-management:3000"

export enum USER_STATUS {
	"ONLINE",
	"OFFLINE",
	"IN_GAME"
}

export async function handleUserStatus(username: string, status: USER_STATUS) {
	const response = await fetch(`${USER_MANAGEMENT_URL}/profiles/${username}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ status: USER_STATUS[status] })
	});
	if (!response.ok) {
		console.error("USER-PRESENCE ERROR: Error updating status of ", username);
	}
}