import { convexAuth } from "@convex-dev/auth/server";

// Use bare minimum Convex Auth for the infrastructure
// We handle auth ourselves with username/password via mutations
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [],
});
