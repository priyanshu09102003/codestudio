import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "CodeStudio by CodeSwift",
  description: "Intelligent Development Environment",
};

export default function Home() {
  return (
    <div className=" z-20 flex flex-col items-center justify-start min-h-screen py-2 mt-10">
      <div className="flex flex-col justify-center items-center my-5">
      <Image src={"/hero.svg"} alt="Hero-Section" height={500}  width={500}/>
      
      <h1 className=" z-20 text-6xl mt-5 font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 dark:from-rose-400 dark:via-red-400 dark:to-pink-400 tracking-tight leading-[1.3] ">
        Where Intelligence Meets Code
      </h1>
      </div>
     

      <p className="mt-2 text-lg text-center text-gray-600 dark:text-gray-400 px-5 py-10 max-w-2xl">
        CodeStudio by CodeSwift is an intelligent code editor designed to enhance your productivity with advanced features, seamless integration, and powerful debugging tools.
      </p>
      <Link href={"/dashboard"}>
        <Button variant={"brand"} className="mb-4 cursor-pointer" size={"lg"}>
          Code Playground
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
      
    </div>
  );
}
