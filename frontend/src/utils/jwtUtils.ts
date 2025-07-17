// JWT utility functions

export interface DecodedToken {
  id: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT token without verification (client-side only)
 * This should not be used for security validation, only for reading user info
 */
export function decodeJWT(token: string): DecodedToken | null {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    // const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // Decode from base64
    const decodedPayload = atob(payload);

    // Parse JSON
    const tokenData = JSON.parse(decodedPayload);

    return tokenData as DecodedToken;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Get current user info from stored token
 */
export function getCurrentUser(): DecodedToken | null {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return null;
  }

  return decodeJWT(token);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * Get current username from token
 */
export function getCurrentUsername(): string | null {
  const user = getCurrentUser();
  return user?.username || null;
}
