import React from 'react'
import type { Metadata } from "next";
import AddNewButton from '@/features/dashboard/components/AddNewButton';
import NavigateButton from '@/features/dashboard/components/NavigateButton';
import EmptyState from '@/components/ui/emptyState';

export const metadata: Metadata = {
  title: "CodeStudio - Dashboard",
  description: "CodePlayground and Project Setup",
};

const DashboardPage = () => {
  const playgrounds:any[] = [];
  return (
    <div className='flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10'>
      <div className='grid grid-col-1 md:grid-cols-2 gap-6 w-full'>

        <AddNewButton/>
        <NavigateButton/>

      </div>

      <div className="mt-10 flex flex-col justify-center items-center w-full">
        {playgrounds && playgrounds.length === 0 ? (<EmptyState title='No Projects Found' description='Create a New Project to get started' imageSrc='/empty-state.svg'/>) : 
        
        (
          // Add Playground table

          <p>Playground Table</p>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
