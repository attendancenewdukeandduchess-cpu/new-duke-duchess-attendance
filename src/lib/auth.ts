import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        employeeId: { label: "Employee ID", type: "text" },
        password:   { label: "Password",    type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) return null;

        try {
          await connectDB();
        } catch (dbErr: any) {
          console.error('Database connection error:', dbErr?.message || dbErr);
          return null;
        }

        const id = credentials.employeeId.trim();
        const user = await User.findOne({
          $or: [
            { employeeId: { $regex: new RegExp(`^${id}$`, 'i') } },
            { mobile: id }
          ],
          status: 'ACTIVE'
        }).lean() as any;

        if (!user) return null;

        const isValid = (credentials.password === user.password) || await bcrypt.compare(credentials.password, user.password).catch(() => false);
        if (!isValid) return null;

        return {
          id:          user._id.toString(),
          name:        user.name,
          employeeId:  user.employeeId,
          role:        user.role,
          designation: user.designation || '',
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.employeeId  = (user as any).employeeId;
        token.role        = (user as any).role;
        token.designation = (user as any).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id          = token.id;
        (session.user as any).employeeId  = token.employeeId;
        (session.user as any).role        = token.role;
        (session.user as any).designation = token.designation;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' }
};
