import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "CodeStudio Editor",
  description: "Personalized AI-Powered Editor",
};
export default function PlaygroundLayout({
    children,
}:{
    children: React.ReactNode
}){
    return(
        <SidebarProvider>
            {children}
        </SidebarProvider>
    )
}