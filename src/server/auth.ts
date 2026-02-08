export function validateToken(token: string | null): boolean {
    if (!token) return false;
    // TODO: Replace with real JWT validation in future phase
    return token === "valid-mock-token" || token.startsWith("valid-");
}
