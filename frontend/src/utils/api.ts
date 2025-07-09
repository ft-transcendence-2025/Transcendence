// Helper function to get headers with Authorization if token exists
export function getHeaders(contentType = "application/json") {
	const headers: Record<string, string> = {
	  "Content-Type": contentType,
	};
	const token = localStorage.getItem("authToken");
	if (token) {
	  headers["Authorization"] = `Bearer ${token}`;
	}
	return headers;
  }
  
  // Generic request wrapper function
  export async function request<T>(
	url: string,
	options: RequestInit = {},
  ): Promise<T> {
	const response = await fetch(url, options);
  
	if (!response.ok) {
	  let errorMessage = `HTTP error! status: ${response.status}`;
	  try {
		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
		  const errorData = await response.json();
		  if (errorData.error && Array.isArray(errorData.error)) {
			const firstError = errorData.error[0];
			if (firstError && firstError.message) {
			  errorMessage = firstError.message;
			}
		  } else if (errorData.message) {
			errorMessage = errorData.message;
		  } else if (errorData.error) {
			errorMessage = String(errorData.error);
		  }
		} else {
		  const text = await response.text();
		  errorMessage = text || errorMessage;
		}
	  } catch (parseError) {
		console.log("Failed to parse error response:", parseError);
	  }
	  throw new Error(errorMessage);
	}
  
	return response.json() as Promise<T>;
  }