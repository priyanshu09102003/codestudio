import {Poppins } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import {SessionProvider} from "next-auth/react"
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets:["latin"],
  weight: ["100" , "200" , "300" , "400", "500" , "600" , "700" , "800", "900"],
})


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth()
  return (

    <SessionProvider session = {session}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${poppins.className} antialiased`}
        >

          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster/>
               {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
