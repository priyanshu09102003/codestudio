"use client"

import React, {useRef, useEffect, useCallback} from 'react'
import Editor, {type Monaco} from "@monaco-editor/react"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from '../lib/editor-config'
import { TemplateFile } from '../types'


interface PlaygroundEditorProps{
    activeFile: TemplateFile | undefined
    content: string
    onContentChange:(value:string) => void
    suggestion: string | null
    suggestionLoading: boolean
    suggestionPosition: { line: number; column: number } | null
    onAcceptSuggestion: (editor: any, monaco: any) => void
    onRejectSuggestion: (editor: any) => void
    onTriggerSuggestion: (type: string, editor: any, fileName?: string) => void
    isAIEnabled: boolean  // ADD THIS PROP
}


const PlaygroundEditor = ({
    activeFile,
    content,
    onContentChange,
    suggestion,
    suggestionLoading,
    suggestionPosition,
    onAcceptSuggestion,
    onRejectSuggestion,
    onTriggerSuggestion,
    isAIEnabled,  // ADD THIS
}:PlaygroundEditorProps) => {

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const inlineCompletionProviderRef = useRef<any>(null)
    const currentSuggestionRef = useRef<{
        text: string
        position: { line: number; column: number }
        id: string
    } | null>(null)
    const isAcceptingSuggestionRef = useRef(false)
    const suggestionAcceptedRef = useRef(false)
    const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const tabCommandRef = useRef<any>(null)


    // Generate unique ID for each suggestion
    const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random()}`

    // Get filename for API call
    const getFileName = useCallback(() => {
        if (!activeFile) return 'file.js';
        return `${activeFile.filename}.${activeFile.fileExtension}`;
    }, [activeFile]);

    const createInlineCompletionProvider = useCallback(
        (monaco: Monaco)=>{
            return{
                provideInlineCompletions: async (model: any, position: any) => {
                    // CHECK IF AI IS ENABLED FIRST
                    if (!isAIEnabled) {
                        console.log("AI is disabled, skipping suggestions")
                        return { items: [] }
                    }

                    //Dont provide completions if we're currently accepting or have already accepted

                    if(isAcceptingSuggestionRef.current || suggestionAcceptedRef.current){
                        console.log("Skipping completion - already accepting/accepted")
                        return{items: []}
                    }

                    if(!suggestion || !suggestionPosition){
                        return{ items: []}
                    }

                    const currentLine = position.lineNumber;
                    const currentColumn = position.column;
                    const isPositionMatch =
                    currentLine === suggestionPosition.line &&
                    currentColumn >= suggestionPosition.column &&
                    currentColumn <= suggestionPosition.column + 2
                       if (!isPositionMatch) {
                            console.log("Position mismatch", {
                            current: `${currentLine}:${currentColumn}`,
                            expected: `${suggestionPosition.line}:${suggestionPosition.column}`,
                            })
                            return { items: [] }
                        }

                    const suggestionID = generateSuggestionId();
                    currentSuggestionRef.current={
                        text: suggestion,
                        position: suggestionPosition,
                        id: suggestionID
                    }

                    const cleanSuggestion = suggestion.replace(/\r/g, "")

                    console.log("Providing inline completion:", cleanSuggestion.substring(0, 50) + "...")

                    return{
                        items:[
                            {
                                insertText: cleanSuggestion,
                                range: new monaco.Range(
                                    suggestionPosition.line,
                                    suggestionPosition.column,
                                    suggestionPosition.line,
                                    suggestionPosition.column,
                                ),
                                command: {
                                    id: 'ai-suggestion',
                                    title: 'AI Suggestion'
                                }
                            }
                        ]
                    }
                    
                },

                freeInlineCompletions: (completions: any)=> {
                    console.log("FreeInline Completion Called")
                },
                    
            }
        }, [suggestion, suggestionPosition, isAIEnabled]  // ADD isAIEnabled to dependencies
    );

    //Clear current suggestion

    const clearCurrentSuggestion = useCallback(() => {
        console.log("Clear current suggestion")
        currentSuggestionRef.current = null;
        suggestionAcceptedRef.current = false
        if(editorRef.current){
            editorRef.current.trigger("ai", "editor.action.inlineSuggest.hide", null)
        }
    }, [])

    //Accept current suggestion with double acceptance prevention
    const acceptCurrentSuggestion = useCallback(()=>{
        if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) {
            console.log("Cannot accept suggestion - missing refs")
            return false
        }

        //PREVENT Double acceptance of suggestion

        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
        console.log("BLOCKED: Already accepting/accepted suggestion, skipping")
        return false
        }

        isAcceptingSuggestionRef.current = true;
        suggestionAcceptedRef.current = true;

        const editor = editorRef.current;
        const monaco = monacoRef.current;

        const currentSuggestion = currentSuggestionRef.current;

        try {
            // Clean the suggestion text (remove \r characters)
            const cleanSuggestionText = currentSuggestion.text.replace(/\r/g, "")

            // Get current cursor position to validate
            const currentPosition = editor.getPosition()
            const suggestionPos = currentSuggestion.position

            
            if (
                currentPosition.lineNumber !== suggestionPos.line ||
                currentPosition.column < suggestionPos.column ||
                currentPosition.column > suggestionPos.column + 5
            ) {
                console.log("Position changed, cannot accept suggestion")
                return false
            }

            const range = new monaco.Range(suggestionPos.line, suggestionPos.column, suggestionPos.line, suggestionPos.column)
            const success = editor.executeEdits("ai-suggestion-accept", [
                {
                range: range,
                text: cleanSuggestionText,
                forceMoveMarkers: true,
                },
            ])

            if (!success) {
            console.error("Failed to execute edit")
            return false;
        }

        const lines = cleanSuggestionText.split("\n");
        const endLine = suggestionPos.line + lines.length - 1
        const endColumn = lines.length === 1 ? suggestionPos.column + cleanSuggestionText.length : lines[lines.length - 1].length + 1

        editor.setPosition({lineNumber:endLine, column: endColumn});

        clearCurrentSuggestion();

        onAcceptSuggestion(editor, monaco);


        return true;



        } catch (error) {

            return false;
            
        }

        finally{

        // Reset accepting flag immediately
        isAcceptingSuggestionRef.current = false

        // Keep accepted flag for longer to prevent immediate re-acceptance
        setTimeout(() => {
            suggestionAcceptedRef.current = false
            console.log("Reset suggestionAcceptedRef flag")
        }, 1000) 
            }
    }, [clearCurrentSuggestion, onAcceptSuggestion])


    const hasActiveSuggestionAtPosition = useCallback(() => {
        if (!editorRef.current || !currentSuggestionRef.current) return false

        const position = editorRef.current.getPosition()
        const suggestion = currentSuggestionRef.current

        return (
        position.lineNumber === suggestion.position.line &&
        position.column >= suggestion.position.column &&
        position.column <= suggestion.position.column + 2)

    }, [])

    // Clear suggestions when AI is disabled
    useEffect(() => {
        if (!isAIEnabled && currentSuggestionRef.current) {
            console.log("AI disabled, clearing current suggestion")
            clearCurrentSuggestion()
            if (editorRef.current) {
                onRejectSuggestion(editorRef.current)
            }
        }
    }, [isAIEnabled, clearCurrentSuggestion, onRejectSuggestion])

    useEffect(() => {

        if(!editorRef.current || !monacoRef.current)return;

        const editor = editorRef.current;
        const monaco = monacoRef.current;

    // Don't update if we're in the middle of accepting a suggestion
        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
        console.log("Skipping update - currently accepting/accepted suggestion")
        return
        }

    //Dispose the previous provider

    if (inlineCompletionProviderRef.current) {
      inlineCompletionProviderRef.current.dispose()
      inlineCompletionProviderRef.current = null
    }

    //Clear the current suggestion reference

    currentSuggestionRef.current = null;

    //Register a new provider if we have a new suggestion

    if(suggestion && suggestionPosition){  // REMOVED isAIEnabled check here - provider can register but won't provide completions if disabled
        const language = getEditorLanguage(activeFile?.fileExtension || "")
        const provider = createInlineCompletionProvider(monaco);

        console.log("Registering inline completion provider for language:", language)

        inlineCompletionProviderRef.current = monaco.languages.registerInlineCompletionsProvider(language, provider);

        // Small delay to ensure editor is ready, then trigger suggestions
        setTimeout(() => {
            if (editorRef.current && !isAcceptingSuggestionRef.current && !suggestionAcceptedRef.current && isAIEnabled) {
            console.log("Triggering inline suggestions")
            editor.trigger("ai", "editor.action.inlineSuggest.trigger", null)
            }
        }, 100)}

        return () => {
            if (inlineCompletionProviderRef.current) {
                inlineCompletionProviderRef.current.dispose()
                inlineCompletionProviderRef.current = null
            }
        }


    }, [suggestion, suggestionPosition, activeFile, createInlineCompletionProvider, isAIEnabled])


    const handleEditorDidMount = (editor: any, monaco:Monaco)=>{
        editorRef.current = editor;
        monacoRef.current = monaco;

        editor.updateOptions({
            ...defaultEditorOptions,

            //enable inline suggestions

            inlineSuggest:{
                enabled: true,
                mode: "subwordSmart",
                suppressSuggestions: false
            },

             // Disable some conflicting suggest features
            suggest: {
                preview: false, // Disable preview to avoid conflicts
                showInlineDetails: false,
                insertMode: "replace",
            },

            // Quick suggestions
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },

            //Smooth cursor
            cursorSmoothCaretAnimation: "on",
        })

        

        configureMonaco(monaco)

        //Add keyboard shortcuts for AI Suggestion
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            // CHECK IF AI IS ENABLED
            if (!isAIEnabled) {
                console.log("AI is disabled, ignoring Ctrl+Space")
                return
            }
            console.log("Ctrl+Space pressed, triggering suggestion")
            onTriggerSuggestion("completion", editor, getFileName())
        })

        // FIX: Only dispose if it exists
        if(tabCommandRef.current) {
            try {
                tabCommandRef.current.dispose()
            } catch (e) {
                console.warn("Failed to dispose tab command:", e)
            }
            tabCommandRef.current = null
        }

        // Register Tab key command - FIXED: Remove context condition
        tabCommandRef.current = editor.addCommand(
            monaco.KeyCode.Tab, 
            () => {
                console.log("Tab pressed")
                if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
                    console.log("Accepting suggestion via Tab")
                    const accepted = acceptCurrentSuggestion()
                    if (accepted) {
                        return // Prevent default tab behavior
                    }
                }
                // If no suggestion, trigger default tab
                editor.trigger('keyboard', 'tab', null)
            }
        )

        editor.addCommand(monaco.KeyCode.Escape, ()=> {
            console.log("Esc pressed")
            if(currentSuggestionRef.current){
                onRejectSuggestion(editor);
                clearCurrentSuggestion()
            }
        })

        // Listen for cursor position changes to hide suggestions when moving away
        editor.onDidChangeCursorPosition((e: any) => {
        if (isAcceptingSuggestionRef.current) return

        const newPosition = e.position

        // Clear existing suggestion if cursor moved away
            if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
                const suggestionPos = currentSuggestionRef.current.position

                // If cursor moved away from suggestion position, clear it
                if (
                newPosition.lineNumber !== suggestionPos.line ||
                newPosition.column < suggestionPos.column ||
                newPosition.column > suggestionPos.column + 10
                ) {
                console.log("Cursor moved away from suggestion, clearing")
                clearCurrentSuggestion()
                onRejectSuggestion(editor)
                }
            }

        // Trigger new suggestion if appropriate - CHECK IF AI IS ENABLED
            if (!currentSuggestionRef.current && !suggestionLoading && isAIEnabled) {
                // Clear any existing timeout
                if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current)
                }

                // Trigger suggestion with a delay
                suggestionTimeoutRef.current = setTimeout(() => {
                onTriggerSuggestion("completion", editor, getFileName())
                }, 500)
            }

        })

        // Listen for content changes to detect manual typing over suggestions
            editor.onDidChangeModelContent((e: any) => {
            if (isAcceptingSuggestionRef.current) return

            // If user types while there's a suggestion, clear it (unless it's our insertion)
            if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
                const change = e.changes[0]

                // Check if this is our own suggestion insertion
                if (
                change.text === currentSuggestionRef.current.text ||
                change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
                ) {
                console.log("Our suggestion was inserted, not clearing")
                return
                }

                // User typed something else, clear the suggestion
                console.log("User typed while suggestion active, clearing")
                clearCurrentSuggestion()
            }

                // Trigger context-aware suggestions on certain typing patterns - CHECK IF AI IS ENABLED
                if (e.changes.length > 0 && !suggestionAcceptedRef.current && isAIEnabled) {
                const change = e.changes[0]

                // Trigger suggestions after specific characters
                if (
                change.text === "\n" || // New line
                change.text === "{" || // Opening brace
                change.text === "." || // Dot notation
                change.text === "=" || // Assignment
                change.text === "(" || // Function call
                change.text === "," || // Parameter separator
                change.text === ":" || // Object property
                change.text === ";" // Statement end
                ) {
                setTimeout(() => {
                    if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading) {
                    onTriggerSuggestion("completion", editor, getFileName())
                    }
                }, 200) // Small delay to let the change settle
                }
            }
            })




        updateEditorLanguage()
    }

    const updateEditorLanguage = () => {
        if(!activeFile || !monacoRef.current || !editorRef.current) return
        const model = editorRef.current.getModel()
        if(!model) return

        const language = getEditorLanguage(activeFile.fileExtension || "")
        try {
            monacoRef.current.editor.setModelLanguage(model, language)
        } catch (error) {
            console.warn("Failed to set editor language", error)
        }
    }

    useEffect(() => {
        updateEditorLanguage()
    },[activeFile])

    // Cleanup on unmount
        useEffect(() => {
        return () => {
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current)
        }
        if (inlineCompletionProviderRef.current) {
            inlineCompletionProviderRef.current.dispose()
            inlineCompletionProviderRef.current = null
        }
        if (tabCommandRef.current) {
            try {
                tabCommandRef.current.dispose()
            } catch (e) {
                console.warn("Failed to dispose tab command on unmount:", e)
            }
            tabCommandRef.current = null
        }
        }
    }, [])


  return (
    <div className='h-full relative'>

        {/* AI Thinking */}

        {
            suggestionLoading && isAIEnabled && (
                <div className='absolute top-2 right-2 z-10 bg-blue-100 dark:bg-blue-900 px-3 py-1.5 rounded-md text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 shadow-sm'>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    AI Thinking...
                </div>
            )
        }

        {/* ACTIVE SUGGESTION INDICATOR */}

        {currentSuggestionRef.current && !suggestionLoading && isAIEnabled && (
            <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-3 py-1.5 rounded-md text-xs text-green-700 dark:text-green-300 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs font-mono">Tab</kbd> to accept
            </div>
        )}


        <Editor 
        height={"100%"}
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension||"") : "plaintext"}
        //@ts-ignore
        options={defaultEditorOptions}
        />
      
    </div>
  )
}

export default PlaygroundEditor