export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  tenantId: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthConfig {
  provider: "clerk" | "authjs";
  redirectAfterSignIn: string;
  redirectAfterSignOut: string;
}
