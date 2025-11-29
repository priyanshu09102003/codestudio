"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Code2, Compass, Database, FlameIcon, Home, Lightbulb, LucideIcon, Plus, Star, Terminal, Zap, History, FolderPlus, Settings, LayoutDashboard } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react'


interface PlaygroundDataProps{
    id: string;
    name: string;
    icon: string;
    starred: boolean;
}

const lucideIconMap:Record<string, LucideIcon>={
  Zap:Zap,
  Lightbulb: Lightbulb,
  Database: Database,
  Compass: Compass,
  FlameIcon: FlameIcon,
  Terminal: Terminal,
  Code2: Code2,
}

const DashboardSidebar = ({initialPlaygroundData}:{initialPlaygroundData:PlaygroundDataProps[]}) => {

    const pathname = usePathname();
    const[starredPlaygrounds, setStarredPlaygrounds] = useState(initialPlaygroundData.filter((p)=> p.starred))

    const [recentPlaygrounds, setRecentPlaygrounds] = useState(initialPlaygroundData);


    
  return (
    <Sidebar variant='inset' collapsible='icon' className='border border-r'>


      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3 justify-center">
          <Image src={"/logo.svg"} alt="Logo" height={40} width={40}/>
          <h2 className='font-bold'>CodeStudio</h2>
        </div>
      </SidebarHeader>


      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link href={"/"}>
                          <Home className='size-4' />
                          <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

          </SidebarMenu>

          <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname==="/dashboard"} tooltip={"Dashboard"}>
                        <Link href={"#"}>
                          <LayoutDashboard className='size-4' />
                          <span>Dashboard</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

          </SidebarMenu>

        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Star className='size-4 mr-2' />
              Starred Playgrounds
          </SidebarGroupLabel>

          <SidebarGroupAction title='Add starred Playground'>
              <Plus className='size-4' />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              {
                starredPlaygrounds.length === 0 && recentPlaygrounds.length === 0 ? (
                  <div className='text-center text-muted-foreground py-4 w-full'>
                    Create your Playground
                  </div>
                ) : (
                  starredPlaygrounds.map((playground) =>{
                    const IconComponent = lucideIconMap[playground.icon] || Code2;
                    return(
                      <SidebarMenuItem key={playground.id}>
                          <SidebarMenuButton asChild isActive={pathname === `/playground/${playground.id}`} tooltip={playground.name}>

                            <Link href={`/playground/${playground.id}`}>
                            {IconComponent && <IconComponent className='size-4' />}
                              <span>
                                {playground.name}
                              </span>
                            </Link>

                          </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                )
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

         <SidebarGroup>
          <SidebarGroupLabel>
            <History className="h-4 w-4 mr-2" />
            Recent Projects
          </SidebarGroupLabel>
          <SidebarGroupAction title="Create new playground">
            <FolderPlus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {starredPlaygrounds.length === 0 && recentPlaygrounds.length === 0 ? null : (
                recentPlaygrounds.map((playground) => {
                  const IconComponent = lucideIconMap[playground.icon] || Code2;
                  return (
                    <SidebarMenuItem key={playground.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/playground/${playground.id}`}
                        tooltip={playground.name}
                      >
                        <Link href={`/playground/${playground.id}`}>
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{playground.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View all">
                  <Link href="/playgrounds">
                    <span className="text-sm text-muted-foreground">View all Playgrounds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>

        </SidebarGroup>
        
      </SidebarContent>


      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>


      <SidebarRail/>
    </Sidebar>
  )
}

export default DashboardSidebar
