"use client"

import React, {useRef, useEffect, useCallback} from 'react'
import Editor, {type Monaco} from "@monaco-editor/react"
import { TemplateFile } from '../lib/path-to-json'
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from '../lib/editor-config'


interface PlaygroundEditorProps{
    activeFile: TemplateFile | undefined
    content: string
    onContentChange:(value:string) => void
    suggestion: string | null
    suggestionLoading: boolean
    suggestionPosition: { line: number; column: number } | null
    onAcceptSuggestion: (editor: any, monaco: any) => void
    onRejectSuggestion: (editor: any) => void
    onTriggerSuggestion: (type: string, editor: any) => void
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

    const createInlineCompletionProvider = useCallback(
        (monaco: Monaco)=>{
            return{
                provideInlineCompletions:async(position:any)=>{
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
                                kind:monaco.languages.CompletedItemKind.Snippet,
                                label: 'AI Suggestion',
                                detail: "AI-generated code suggestion",
                                documentation: "Press Tab to accept",
                                sortText: "0000",
                                filterText: "",
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, 
                            }
                        ]
                    }
                    
                    },

                    freeInlineCompletions: (completions: any)=> {
                        console.log("FreeInline Completion Called")
                    },
                    
            }
        }, [suggestion, suggestionPosition]
    )


    const handleEditorDidMount = (editor: any, monaco:Monaco)=>{
        editorRef.current = editor;
        monacoRef.current = monaco;

        configureMonaco(monaco)
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


  return (
    <div className='h-full relative'>

        {/* TODO: AI Thinking */}


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
