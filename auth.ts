import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { AuthService } from "./lib/service/AuthService";
import { ServiceProviderService } from "./lib/service/ServiceProviderService";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username"},
        password: { label: "Password", type: "password", placeholder: "Password"}
      },

      async authorize(credentials, _) {
        const as = new AuthService(new ServiceProviderService());

        const username = credentials.username as string;
        const password = credentials.password as string;

        const loginUser = await as.login(username, password);

        if (!loginUser) return null;

        return {
          id: loginUser.id,
          name: `${loginUser.firstName} ${loginUser.lastName}`,
        };
      }
    })
  ],
  callbacks: {
    // Enforces auth in proxy.ts (the matcher already excludes /setup, /api and
    // static assets). Unauthenticated requests are redirected to the signIn page.
    authorized({ auth }) {
      return !!auth;
    },
    // Expose the service provider's id on the session for scoping data.
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: "jwt",
  }
})