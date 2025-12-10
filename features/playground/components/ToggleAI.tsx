"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Code, 
  FileText, 
  Import, 
  Loader2,
  Power,
  PowerOff,
  Braces,
  Variable,
  Brain,
  Sparkles,
  Keyboard
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import {AIChatSidePanel} from "@/features/AIChat/components/AIChatSidePanel";
import { toast } from "sonner";


interface toggleAIProps{
    isEnabled: boolean;
    onToggle : (value:boolean)=> void;
    suggestionLoading: boolean
    loadingProgress?:number;
    activeFeature?: string;
    // Props for code insertion
    activeFile?: { name: string; content: string; language?: string };
    cursorPosition?: { line: number; column: number };
    onInsertCode?: (code: string, fileName?: string, position?: { line: number; column: number }) => void;
}


const ToggleAI = ({
    isEnabled, 
    onToggle, 
    suggestionLoading, 
    loadingProgress = 0, 
    activeFeature,
    activeFile,
    cursorPosition,
    onInsertCode
}: toggleAIProps) => {

    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // IMPLEMENTED: Handler for code insertion from AI chat panel
    const handleInsertCode = (code: string, fileName?: string, position?: { line: number; column: number }) => {
        if (onInsertCode) {
            onInsertCode(code, fileName || activeFile?.name, position || cursorPosition);
            toast.success("Code inserted into editor");
        } else {
            // Fallback: copy to clipboard if no insertion handler
            navigator.clipboard.writeText(code);
            toast.info("Code copied to clipboard");
        }
    };

     // IMPLEMENTED: Handler for running code from AI chat panel
    const handleRunCode = (code: string, language: string) => {
        console.log("Run code:", { code, language });
        toast.info(`Running ${language} code...`);
    };


  return (

    <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={"sm"} variant={isEnabled?"default" : "outline"} className={cn(
                "relative gap-2 h-8 px-3 text-sm font-medium transition-all duration-200",
                isEnabled 
                    ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-50 border-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200" 
                    : "bg-background hover:bg-accent text-foreground border-border",
                suggestionLoading && "opacity-75"
                )}
                onClick={(e) => e.preventDefault()}
                >

                    {
                        suggestionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Brain className="h-4 w-4" />
                        )
                    }

                    <span>ASK AI</span>
                    {
                        isEnabled? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        ) : (<div  className="w-2 h-2 bg-red-500 rounded-full animate-spin"/>)
                    }

                </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">

                <DropdownMenuLabel className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground"/>
                        <span className="text-sm font-medium">AI Assistant</span>
                    </div>

                    <Badge 
                        variant="outline" 
                        className={cn(
                            "text-xs",
                            isEnabled 
                            ? "bg-zinc-900 text-zinc-50 border-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-200" 
                            : "bg-muted text-muted-foreground"
                        )}
                        >
                        {isEnabled ? "Active" : "Inactive"}
                    </Badge>
                </DropdownMenuLabel>

                {
                    suggestionLoading && activeFeature && (
                        <div className="px-3 pb-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">

                                    <span>{activeFeature}</span>
                                    <span>{Math.round(loadingProgress)}%</span>

                                </div>

                                <Progress
                                value={loadingProgress}
                                className="h-1.5"
                                />

                            </div>

                        </div>
                    )
                }

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onToggle(!isEnabled)}
                className="py-2.5 cursor-pointer"
                >

                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">

                            {
                                isEnabled ? (

                                    <Power className="size-4 text-muted-foreground" />
                                ):(
                                    <PowerOff className="size-4 text-muted-foreground" />
                                )
                            }

                            <div>
                                <div className="text-sm font-medium">
                                    {
                                        isEnabled ? "Disable" : "Enable"
                                    } AI

                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Toggle AI Assistance
                                </div>
                            </div>

                        </div>


                        <div className={cn(
                            "w-8 h-4 rounded-full border transition-all duration-200 relative",
                            isEnabled 
                            ? "bg-zinc-900 border-zinc-900 dark:bg-zinc-50 dark:border-zinc-50" 
                            : "bg-muted border-border"
                        )}>
                            <div className={cn(
                            "w-3 h-3 rounded-full bg-background transition-all duration-200 absolute top-0.5",
                            isEnabled ? "left-4" : "left-0.5"
                            )} />
                        </div>

                    </div>

                </DropdownMenuItem>

                {isEnabled && (
                    <>
                        <DropdownMenuSeparator />
                        
                        <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-md mx-2 my-2">
                            <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                        AI Suggestions Active
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">Ctrl+Space</kbd> to manually trigger suggestions, or type special characters like <code className="text-xs">.</code> <code className="text-xs">;</code> <code className="text-xs">{'{'}</code>
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">Tab</kbd> to accept suggestions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <DropdownMenuSeparator/>

                <DropdownMenuItem 
                className="py-2.5 cursor-pointer" onClick={()=>setIsChatOpen(true)}>

                    <div className="flex items-center gap-3 w-full">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <div className="text-sm font-medium">Open Chat</div>
                        <div className="text-xs text-muted-foreground">
                        Chat with AI assistant
                        </div>
                    </div>
                    </div>
            </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>

        <AIChatSidePanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onInsertCode={handleInsertCode}
            onRunCode={handleRunCode}
            activeFileName={activeFile?.name}
            activeFileContent={activeFile?.content}
            activeFileLanguage={activeFile?.language || "TypeScript"}
            cursorPosition={cursorPosition}
            theme="dark"
        />

    </>
  )
}

export default ToggleAI