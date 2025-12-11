"use client";

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  FolderOpen,
  AlertCircle,
  Save,
  X,
  Settings,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import TemplateFileTree from '@/features/playground/components/TemplateFileTree';
import { useFileExplorer } from '@/features/playground/hooks/useFileExplorer';
import { usePlayground } from '@/features/playground/hooks/usePlayground';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TemplateFile } from '@/features/playground/lib/path-to-json';
import PlaygroundEditor from '@/features/playground/components/PlaygroundEditor';
import { useWebContainer } from '@/features/webContainers/hooks/useWebContainer';
import WebContainerPreview from '@/features/webContainers/components/WebContainerPreview';
import LoadingStep from '@/components/ui/loader';
import { LayoutRouter } from 'next/dist/server/app-render/entry-base';
import { findFilePath } from '@/features/playground/lib';
import { TemplateFolder } from '@/features/playground/types';
import ToggleAI from '@/features/playground/components/ToggleAI';
import { useAISuggestions } from '@/features/AIChat/Hooks/useAiSuggestion';




const PlaygroundPage = () => {
    const {id} = useParams<{id: string}>();
    const [isPreviewVisible, setIsPreviewVisible] = useState(true)
    const {playgroundData, templateData, isLoading, error, saveTemplateData} = usePlayground(id)



    const aiSuggestion = useAISuggestions();
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

    const {

      serverUrl,
      isLoading: containerLoading,
      error: containerError,
      instance,
      writeFileSync

      //@ts-ignore
    } = useWebContainer({templateData})

    const lastSyncedContent = useRef<Map<string, string>>(new Map())

    useEffect(()=>{
      setPlaygroundId(id);
    },[id, setPlaygroundId])

    useEffect(() => {
      if(templateData && !openFiles.length){
        setTemplateData(templateData)
      }
    }, [templateData, setTemplateData, openFiles.length])



      const wrappedHandleAddFile = useCallback(
      (newFile: TemplateFile, parentPath: string) => {
        return handleAddFile(
          newFile,
          parentPath,
          writeFileSync!,
          instance,
          saveTemplateData
        );
      },
      [handleAddFile, writeFileSync, instance, saveTemplateData]
    );

    
          const wrappedHandleAddFolder = useCallback(
      (newFolder: TemplateFolder, parentPath: string) => {
        return handleAddFolder(newFolder, parentPath, instance, saveTemplateData);
      },
      [handleAddFolder, instance, saveTemplateData]
    );

    const wrappedHandleDeleteFile = useCallback(
      (file: TemplateFile, parentPath: string) => {
        return handleDeleteFile(file, parentPath, saveTemplateData);
      },
      [handleDeleteFile, saveTemplateData]
    );

    const wrappedHandleDeleteFolder = useCallback(
      (folder: TemplateFolder, parentPath: string) => {
        return handleDeleteFolder(folder, parentPath, saveTemplateData);
      },
      [handleDeleteFolder, saveTemplateData]
    );

    const wrappedHandleRenameFile = useCallback(
      (
        file: TemplateFile,
        newFilename: string,
        newExtension: string,
        parentPath: string
      ) => {
        return handleRenameFile(
          file,
          newFilename,
          newExtension,
          parentPath,
          saveTemplateData
        );
      },
      [handleRenameFile, saveTemplateData]
    );

    const wrappedHandleRenameFolder = useCallback(
      (folder: TemplateFolder, newFolderName: string, parentPath: string) => {
        return handleRenameFolder(
          folder,
          newFolderName,
          parentPath,
          saveTemplateData
        );
      },
      [handleRenameFolder, saveTemplateData]
    );




    const activeFile = openFiles.find((file) => file.id === activeFileId);
    const hasUnsavedChanges = openFiles.some((file) => file.hasUnsavedChanges)
    const handleFileSelect = (file:TemplateFile)=>{
      openFile(file)
    }


   const handleContentChange = useCallback((value: string) => {
  if (activeFileId) {
    updateFileContent(activeFileId, value)
  }
}, [activeFileId, updateFileContent])

    const handleInsertCodeFromChat = useCallback((
    code: string, 
    fileName?: string, 
    position?: { line: number; column: number }
  ) => {
    if (!activeFileId) {
      toast.error("No active file to insert code into");
      return;
    }

    // Get current content
    const currentFile = openFiles.find(f => f.id === activeFileId);
    if (!currentFile) return;

    // Insert code at cursor position or append to end
    const lines = currentFile.content.split('\n');
    const insertLine = position?.line || lines.length;
    
    // Insert the code
    lines.splice(insertLine, 0, code);
    const newContent = lines.join('\n');
    
    // Update file content
    updateFileContent(activeFileId, newContent);
    
    toast.success("Code inserted successfully!");
  }, [activeFileId, openFiles, updateFileContent]);



const refreshPreview = useCallback(() => {
  const iframe = document.querySelector('iframe');
  if (iframe && iframe.src) {
    console.log("🔄 Refreshing preview iframe...");
    iframe.src = iframe.src;
  }
}, []);

const handleSave = useCallback(
  async(fileId?:string)=>{
    const targetFileId = fileId || activeFileId;
    if(!targetFileId) return;
    const fileToSave = openFiles.find((f) => f.id === targetFileId)
    if(!fileToSave) return;
    const latestTemplateData = useFileExplorer.getState().templateData;
    if(!latestTemplateData) return;

    try {
      const filePath = findFilePath(fileToSave, latestTemplateData);
      if(!filePath){
        toast.error(`Could not find path for file: ${fileToSave.filename}.${fileToSave.fileExtension}`)
        return;
      }

      console.log("💾 Saving file:", filePath);

      if (instance && instance.fs) {
        try {
          const pathParts = filePath.split('/');
          if (pathParts.length > 1) {
            const dirPath = pathParts.slice(0, -1).join('/');
            await instance.fs.mkdir(dirPath, { recursive: true });
          }
          
          await instance.fs.writeFile(filePath, fileToSave.content, 'utf-8');
          console.log("✅ File written to WebContainer");
          
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
          
          // Force iframe refresh after save
          setTimeout(refreshPreview, 500);
          
        } catch (wcError) {
          console.error("❌ WebContainer write error:", wcError);
          toast.error("Failed to update preview");
          throw wcError;
        }
      }

      const updatedTemplateData = JSON.parse(JSON.stringify(latestTemplateData));
      const updateFileContent = (items: any[]) =>
        items.map((item) => {
          if ("folderName" in item) {
            return { ...item, items: updateFileContent(item.items) };
          } else if (
            item.filename === fileToSave.filename &&
            item.fileExtension === fileToSave.fileExtension
          ) {
            return { ...item, content: fileToSave.content };
          }
          return item;
        });
      
      updatedTemplateData.items = updateFileContent(updatedTemplateData.items);

      const newTemplateData = await saveTemplateData(updatedTemplateData);
      setTemplateData(newTemplateData || updatedTemplateData);

      const updatedOpenFiles = openFiles.map((f) =>
        f.id === targetFileId
          ? {
              ...f,
              content: fileToSave.content,
              originalContent: fileToSave.content,
              hasUnsavedChanges: false,
            }
          : f
      );
      setOpenFiles(updatedOpenFiles);

      toast.success(`Saved ${fileToSave.filename}.${fileToSave.fileExtension}`);

    } catch (error) {
      console.error("❌ Error saving file:", error);
      toast.error(`Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`);
    }
},[activeFileId, openFiles, instance, saveTemplateData, setTemplateData, setOpenFiles, refreshPreview])
  
    const handleSaveAll = async() => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);
    if (unsavedFiles.length === 0) {
      toast.info("No unsaved changes");
      return;
    }
  
    console.log(`💾 Saving ${unsavedFiles.length} files...`);
  
    try {
      // Save files sequentially to ensure proper WebContainer updates
      for (const file of unsavedFiles) {
        await handleSave(file.id);
      }
      toast.success(`Saved ${unsavedFiles.length} file(s)`);
    } catch (error) {
      console.error("❌ Failed to save all:", error);
      toast.error("Failed to save some files");
    }
  }

    React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleSaveAll]);


    console.log(templateData)
    console.log("Name:", playgroundData)

    if(error){
      return(
        <div className='flex flex-col items-center justify-center h-[calc(100vh - 4rem)] p-4'>

          <AlertCircle className='h-12 w-12 text-red-500 mb-4' />
          <h2 className='text-xl font-semibold text-red-600 mb-2'>Something went wrong</h2>
          <p className='text-gray-600 mb-4'>{error}</p>

          <Button onClick={() => window.location.reload()} variant={"destructive"}>
            Try Again
          </Button>

        </div>
      )
    }

    

    if(isLoading){
          return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading Playground
          </h2>
          <div className="mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
    }


  
 

  return (
    <TooltipProvider>
      <>
        {/* TEMPLATE FILE TREE  */}

          <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          title='File Explorer'
          onAddFile={wrappedHandleAddFile}
          onAddFolder={wrappedHandleAddFolder}
          onDeleteFile={wrappedHandleDeleteFile}
          onDeleteFolder={wrappedHandleDeleteFolder}
          onRenameFile={wrappedHandleRenameFile}
          onRenameFolder={wrappedHandleRenameFolder}
          />



        <SidebarInset>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>

                <SidebarTrigger className='-ml-1'/>
                <Separator orientation='vertical' className='mr-2 h-4'/>


                <div className="flex flex-1 items-center gap-2">
                    <div className='flex flex-col flex-1'>
                        <h1 className="text-sm font-semibold">{playgroundData?.title || "Code Playground"}</h1>
                        <p className='text-xs text-muted-foreground'>

                          {
                            openFiles.length
                          } File(s) open

                          {hasUnsavedChanges && "• Unsaved changes"}

                        </p>
                    </div>

                    <div className='flex items-center gap-1'>

                      <Tooltip>
                            
                            <TooltipTrigger asChild>

                              <Button size={"sm"} variant={"outline"} onClick={() => handleSave()} disabled={!activeFile || !activeFile.hasUnsavedChanges}>
                                <Save className='size-4' />
                              </Button>

                            </TooltipTrigger>


                            <TooltipContent>
                              Save (Ctrl + S)
                            </TooltipContent>


                      </Tooltip>


                      <Tooltip>
                            
                            <TooltipTrigger asChild>

                              <Button size={"sm"} variant={"outline"} onClick={handleSaveAll} disabled={!hasUnsavedChanges}>
                                <Save className='h-4 w-4' /> All
                              </Button>

                            </TooltipTrigger>


                            <TooltipContent>
                              Save All (Ctrl + Shift + S)
                            </TooltipContent>


                      </Tooltip>


                      {/* TOGGLE AI CHAT */}

                      

                      <ToggleAI
                        isEnabled = {aiSuggestion.isEnabled}
                        onToggle = {aiSuggestion.toggleEnabled}
                        suggestionLoading = {aiSuggestion.isLoading}
                        activeFile={activeFile ? {
                        name: `${activeFile.filename}.${activeFile.fileExtension}`,
                        content: activeFile.content,
                        language: activeFile.fileExtension
                      } : undefined}
                      onInsertCode={handleInsertCodeFromChat}
                      />

                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>

                            <Button size={"sm"} variant={"outline"}>

                              <Settings className='size-4' />

                            </Button>

                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                              >
                                {isPreviewVisible ? "Hide" : "Show"} Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={closeAllFiles}>
                                Close All Files
                              </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>





                    </div>
                </div>

            </header>

            <div className='h-[calc(100vh-4rem)]'>

              {
                openFiles.length > 0 ? (

                  <div className='h-full flex flex-col'>

                    <div className='border-b bg-muted/30'>

                    <Tabs value={activeFileId || ""} onValueChange={setActiveFileId}>

                      <div className='flex items-center justify-between px-4 py-2'>
                        <TabsList className='h-8 bg-transparent p-0'>

                          {
                            openFiles.map((file) => (
                              <TabsTrigger key={file.id} value={file.id} className='relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group'>

                                  <div className='flex items-center gap-2'>

                                    <FileText className='size-3' />

                                    <span>
                                      {file.filename}.{file.fileExtension}
                                    </span>

                                    {
                                      file.hasUnsavedChanges && (
                                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                                      )
                                    }

                                     <span
                                      className="ml-2 h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        closeFile(file.id);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </span>

                                  </div>

                              </TabsTrigger>
                            ))
                          }

                        </TabsList>

                        {
                          openFiles.length > 1 && (
                            <Button
                            size={"sm"}
                            variant="ghost"
                            onClick={closeAllFiles}
                            className='h-6 px-2 text-sm cursor-pointer'
                            >

                              Close All

                            </Button>
                          )
                        }

                      </div>


                    </Tabs>

                    </div>

                    <div className='flex-1'>

                      {/* IMPLEMENT EDITOR */}

                      <ResizablePanelGroup direction='horizontal' className='h-full'>
                      <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                        <PlaygroundEditor 
                          activeFile={activeFile}
                          content={activeFile?.content || ""}
                          onContentChange={handleContentChange}

                          suggestion = {aiSuggestion.suggestion}
                          suggestionLoading = {aiSuggestion.isLoading}
                          suggestionPosition = {aiSuggestion.position}
                          onAcceptSuggestion = {(editor, monaco) => aiSuggestion.acceptSuggestion(editor, monaco)}
                          onRejectSuggestion = {(editor) => aiSuggestion.rejectSuggestion(editor)}
                          onTriggerSuggestion = {(type, editor, fileName) => aiSuggestion.fetchSuggestion(type, editor, fileName)}
                          isAIEnabled={aiSuggestion.isEnabled}
                        />
                      </ResizablePanel>

                      {isPreviewVisible && (
                        <>
                          <ResizableHandle />
                          <ResizablePanel defaultSize={50}>
                            <WebContainerPreview
                              templateData={templateData!}
                              instance={instance}
                              writeFileSync={writeFileSync}
                              isLoading={containerLoading}
                              error={containerError}
                              serverUrl={serverUrl!}
                              forceResetUp={false}
                            />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>

                    </div>

                  </div>

                ) : (


                  <div className='flex flex-col h-full items-center justify-center text-muted-foreground gap-4'>

                    <FileText className='size-16 text-gray-300' />
                    <div className='text-center'>

                      <p className='text-lg font-medium'>No Files Open</p>
                      <p className='text-sm text-gray-500'>Select a file from the File Explorer to start editing</p>

                    </div>

                  </div>

                )
              }

            </div>
        </SidebarInset>
      
      </>
    </TooltipProvider>
  )
}

export default PlaygroundPage
