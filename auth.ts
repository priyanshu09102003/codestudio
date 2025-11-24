import NextAuth from "next-auth"

import {PrismaAdapter} from "@auth/prisma-adapter"
import { db } from "./lib/db"
import authConfig from "./auth.config"
import { getAccountByUserId, getUserById } from "./features/auth/actions"

export const {auth , handlers, signIn, signOut} = NextAuth({
    callbacks:{
          async signIn({ user, account, profile }) {
  if (!user || !account) return false;

  // Check if the user already exists
  const existingUser = await db.user.findUnique({
    where: { email: user.email! },
  });

  // If user does not exist, create a new one
  if (!existingUser) {
    const newUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.name ?? null,
        image: user.image ?? null,
       
        accounts: {
          create: {
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refreshToken: account.refresh_token ?? null,
            accessToken: account.access_token ?? null,
            expiresAt: account.expires_at ?? null,
            tokenType: account.token_type ?? null,
            scope: account.scope ?? null,
            idToken: account.id_token ?? null,
            sessionState: account.session_state ? String(account.session_state) : null,
          },
        },
      },
    });

    if (!newUser) return false;
  } else {
    // Link the account if user exists
    const existingAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
    });

    // If the account does not exist, create it
    if (!existingAccount) {
      await db.account.create({
        data: {
          userId: existingUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refreshToken: account.refresh_token ?? null,
          accessToken: account.access_token ?? null,
          expiresAt: account.expires_at ?? null,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
          idToken: account.id_token ?? null,
          sessionState: account.session_state ? String(account.session_state) : null,
        },
      });
    }
  }

  return true;
},

  async jwt({token, user, account}){
    if(!token.sub)return token;

    const existingUser = await getUserById(token.sub);

    if(!existingUser) return token;

    const existingAccount = await getAccountByUserId(existingUser.id);

    token.name = existingUser.name;

    token.email = existingUser.email;
    token.role = existingUser.role;


    return token;
  },


  async session({session, token}){
    if(token.sub && session.user){
      session.user.id = token.sub;
    }

    if(token.sub && session.user){
      session.user.role = token.role
    }

    return session;
  }



  },
    secret: process.env.AUTH_SECRET,
    adapter:PrismaAdapter(db),
    session:{strategy: "jwt"},
    ...authConfig
})

