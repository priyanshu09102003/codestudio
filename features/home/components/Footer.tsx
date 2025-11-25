import Link from "next/link";
import { Github as LucideGithub, Linkedin } from "lucide-react";
import Image from "next/image";

interface ProjectLink {
  href: string | null;
  text: string;
  description: string;
  icon: string;
  iconDark?: string;
  isNew?: boolean;
}

export function Footer() {
  const socialLinks = [
    {
      href: "https://github.com/priyanshu09102003",
      icon: (
        <LucideGithub className="w-5 h-5 text-white dark:text-zinc-900" />
      ),
    },
    {
      href: "https://www.linkedin.com/in/priyanshu-paul-59221228a",
      icon: (
        <Linkedin className="w-5 h-5 text-white dark:text-zinc-900" />
      ),
    },
  ];

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col items-center space-y-8 text-center">
        {/* Social Links */}
        <div className="flex gap-4">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-zinc-900 dark:bg-zinc-100 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              {link.icon}
            </Link>
          ))}
        </div>

        {/* Copyright and Developer Credit */}
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} CodeSwift. All rights reserved.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Designed and Developed by{" "}
            <Link
              href="https://github.com/priyanshu09102003"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 dark:text-zinc-100 hover:underline font-medium"
            >
              Priyanshu
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;