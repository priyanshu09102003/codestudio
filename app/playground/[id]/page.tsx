"use client";

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import TemplateFileTree from '@/features/playground/components/TemplateFileTree';
import { useFileExplorer } from '@/features/playground/hooks/useFileExplorer';
import { usePlayground } from '@/features/playground/hooks/usePlayground';
import { useParams } from 'next/navigation';
import React from 'react'


const PlaygroundPage = () => {
    const {id} = useParams<{id: string}>();
    const {playgroundData, templateData, isLoading, error, saveTemplateData} = usePlayground(id)
      const {
      activeFileId,
      closeAllFiles,
      openFile,
      closeFile,
      editorContent,
      updateFileContent,
      handleAddFile,
      handleAddFolder,
      handleDeleteFile,
      handleDeleteFolder,
      handleRenameFile,
      handleRenameFolder,
      openFiles,
      setTemplateData,
      setActiveFileId,
      setPlaygroundId,
      setOpenFiles,
    } = useFileExplorer()


    console.log(templateData)
    console.log("Name:", playgroundData)

  return (
    <div>
      <>
        {/* TEMPLATE FILE TREE  */}

          <TemplateFileTree
          data={templateData!}
          />



        <SidebarInset>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>

                <SidebarTrigger className='-ml-1'/>
                <Separator orientation='vertical' className='mr-2 h-4'/>


                <div className="flex flex-1 items-center gap-2">
                    <div className='flex flex-col flex-1'>
                        <span className="font-semibold">{playgroundData?.title || "Code Playground"}</span>
                    </div>
                </div>

            </header>
        </SidebarInset>
      
      </>
    </div>
  )
}

export default PlaygroundPage
