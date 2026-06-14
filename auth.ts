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

        return { };
      }
    })
  ],
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: "jwt",
  }
})