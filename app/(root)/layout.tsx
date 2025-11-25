import Footer from "@/features/home/components/Footer";
import Header from "@/features/home/components/Header";
import { cn } from "@/lib/utils";
import React from "react";

export default function HomeLayout({
    children
}:{
    children: React.ReactNode;
}){

    return(
        <>
            <div className="relative min-h-screen">
                {/* Background Grid */}
                <div
                    className={cn(
                        "absolute inset-0",
                        "[background-size:40px_40px]",
                        "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
                        "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
                    )}
                />
                
                {/* Radial Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"/>

                {/* HEADER */}
                <Header />

                {/* MAIN */}
                <main className="z-20 relative w-full pt-0 md:pt-0">
                    {children}
                </main>
            </div>

            {/* Footer - Outside the background container */}
            <Footer />
        </>
    )
}