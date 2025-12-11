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
    isAIEnabled: boolean
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
    isAIEnabled,
}:PlaygroundEditorProps) => {

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const decorationIdsRef = useRef<string[]>([])
    const currentSuggestionRef = useRef<{
        text: string
        position: { line: number; column: number }
        id: string
    } | null>(null)
    const isAcceptingSuggestionRef = useRef(false)
    const suggestionAcceptedRef = useRef(false)
    const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const tabCommandRef = useRef<any>(null)
    const isAIEnabledRef = useRef(isAIEnabled)

    console.log("🔵 PlaygroundEditor render - isAIEnabled:", isAIEnabled)

    // Sync isAIEnabled to ref
    useEffect(() => {
        isAIEnabledRef.current = isAIEnabled;
        console.log("🟣 isAIEnabled synced to ref:", isAIEnabled);
    }, [isAIEnabled]);

    // Generate unique ID for each suggestion
    const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random()}`

    // Get filename for API call
    const getFileName = useCallback(() => {
        if (!activeFile) return 'file.js';
        return `${activeFile.filename}.${activeFile.fileExtension}`;
    }, [activeFile]);

    // CLEAR DECORATIONS
    const clearDecorations = useCallback(() => {
        if (editorRef.current && decorationIdsRef.current.length > 0) {
            editorRef.current.deltaDecorations(decorationIdsRef.current, [])
            decorationIdsRef.current = []
        }
    }, [])

    // SHOW GREY SUGGESTION TEXT AS DECORATION
    const showSuggestionDecoration = useCallback(() => {
        if (!editorRef.current || !monacoRef.current || !suggestion || !suggestionPosition) {
            return
        }

        const editor = editorRef.current
        const monaco = monacoRef.current

        // Save current cursor position
        const savedPosition = editor.getPosition()

        // Clear existing decorations
        clearDecorations()

        const cleanSuggestion = suggestion.replace(/\r/g, "")
        const lines = cleanSuggestion.split('\n')

        const decorations: any[] = []

        // First line (inline with cursor)
        decorations.push({
            range: new monaco.Range(
                suggestionPosition.line,
                suggestionPosition.column,
                suggestionPosition.line,
                suggestionPosition.column
            ),
            options: {
                after: {
                    content: lines[0],
                    inlineClassName: 'ghost-text'
                },
                showIfCollapsed: true
            }
        })

        // Additional lines (if multi-line suggestion)
        for (let i = 1; i < lines.length; i++) {
            decorations.push({
                range: new monaco.Range(
                    suggestionPosition.line + i,
                    1,
                    suggestionPosition.line + i,
                    1
                ),
                options: {
                    before: {
                        content: lines[i],
                        inlineClassName: 'ghost-text'
                    },
                    showIfCollapsed: true
                }
            })
        }

        // Apply decorations WITHOUT triggering position change
        decorationIdsRef.current = editor.deltaDecorations([], decorations)
        
        // Restore cursor position immediately
        if (savedPosition) {
            editor.setPosition(savedPosition)
        }
        
        console.log("Applied grey suggestion decoration:", lines[0].substring(0, 50))
    }, [suggestion, suggestionPosition, clearDecorations])

    // Clear current suggestion
    const clearCurrentSuggestion = useCallback(() => {
        console.log("Clear current suggestion")
        currentSuggestionRef.current = null
        suggestionAcceptedRef.current = false
        clearDecorations()
    }, [clearDecorations])

    // Accept current suggestion
    const acceptCurrentSuggestion = useCallback(()=>{
        if (!editorRef.current || !monacoRef.current || !currentSuggestionRef.current) {
            console.log("Cannot accept suggestion - missing refs")
            return false
        }

        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            console.log("BLOCKED: Already accepting/accepted suggestion")
            return false
        }

        isAcceptingSuggestionRef.current = true
        suggestionAcceptedRef.current = true

        const editor = editorRef.current
        const monaco = monacoRef.current
        const currentSuggestion = currentSuggestionRef.current

        try {
            const cleanSuggestionText = currentSuggestion.text.replace(/\r/g, "")
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

            const range = new monaco.Range(
                suggestionPos.line, 
                suggestionPos.column, 
                suggestionPos.line, 
                suggestionPos.column
            )
            
            const success = editor.executeEdits("ai-suggestion-accept", [{
                range: range,
                text: cleanSuggestionText,
                forceMoveMarkers: true,
            }])

            if (!success) {
                console.error("Failed to execute edit")
                return false
            }

            const lines = cleanSuggestionText.split("\n")
            const endLine = suggestionPos.line + lines.length - 1
            const endColumn = lines.length === 1 
                ? suggestionPos.column + cleanSuggestionText.length 
                : lines[lines.length - 1].length + 1

            editor.setPosition({lineNumber: endLine, column: endColumn})

            clearCurrentSuggestion()
            onAcceptSuggestion(editor, monaco)

            return true
        } catch (error) {
            console.error("Error accepting suggestion:", error)
            return false
        } finally {
            isAcceptingSuggestionRef.current = false
            setTimeout(() => {
                suggestionAcceptedRef.current = false
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
            position.column <= suggestion.position.column + 2
        )
    }, [])

    // Clear suggestions when AI is disabled
    useEffect(() => {
        console.log("🔵 useEffect - AI enabled check:", isAIEnabled, "Has suggestion:", !!currentSuggestionRef.current)
        if (!isAIEnabled && currentSuggestionRef.current) {
            console.log("AI disabled, clearing current suggestion")
            clearCurrentSuggestion()
            if (editorRef.current) {
                onRejectSuggestion(editorRef.current)
            }
        }
    }, [isAIEnabled, clearCurrentSuggestion, onRejectSuggestion])

    // MAIN EFFECT: Show suggestion as grey text decoration
    useEffect(() => {
        console.log("🔵 Main suggestion effect - suggestion:", !!suggestion, "position:", !!suggestionPosition, "AI enabled:", isAIEnabled)
        
        if (!editorRef.current || !monacoRef.current) return

        if (isAcceptingSuggestionRef.current || suggestionAcceptedRef.current) {
            console.log("Skipping - accepting/accepted")
            return
        }

        // Clear if no suggestion or AI disabled
        if (!suggestion || !suggestionPosition || !isAIEnabled) {
            clearCurrentSuggestion()
            return
        }

        // Validate cursor is still at suggestion position before showing
        const editor = editorRef.current
        const currentPos = editor.getPosition()
        
        if (!currentPos || 
            currentPos.lineNumber !== suggestionPosition.line ||
            currentPos.column < suggestionPosition.column ||
            currentPos.column > suggestionPosition.column + 5) {
            console.log("Cursor moved away from suggestion position, not showing")
            return
        }

        // Store current suggestion
        const suggestionId = generateSuggestionId()
        currentSuggestionRef.current = {
            text: suggestion,
            position: suggestionPosition,
            id: suggestionId
        }

        // Show grey decoration WITHOUT moving cursor
        requestAnimationFrame(() => {
            showSuggestionDecoration()
        })

    }, [suggestion, suggestionPosition, isAIEnabled, clearCurrentSuggestion, showSuggestionDecoration])

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        console.log("🟢 Editor mounted! AI enabled:", isAIEnabled)
        editorRef.current = editor
        monacoRef.current = monaco

        // Add CSS for grey ghost text
        const style = document.createElement('style')
        style.textContent = `
            .ghost-text {
                opacity: 0.4;
                font-style: italic;
            }
        `
        document.head.appendChild(style)

        editor.updateOptions({
            ...defaultEditorOptions,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },
            cursorSmoothCaretAnimation: "on",
        })

        configureMonaco(monaco)

        // Ctrl+Space to trigger suggestion
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            console.log("⌨️ Ctrl+Space pressed, AI enabled:", isAIEnabledRef.current)
            if (!isAIEnabledRef.current) {
                console.log("AI disabled, ignoring Ctrl+Space")
                return
            }
            console.log("Triggering suggestion manually")
            onTriggerSuggestion("completion", editor, getFileName())
        })

        // Tab to accept suggestion
        if (tabCommandRef.current) {
            try {
                tabCommandRef.current.dispose()
            } catch (e) {
                console.warn("Failed to dispose tab command:", e)
            }
            tabCommandRef.current = null
        }

        tabCommandRef.current = editor.addCommand(
            monaco.KeyCode.Tab, 
            () => {
                console.log("Tab pressed")
                if (currentSuggestionRef.current && hasActiveSuggestionAtPosition()) {
                    console.log("Accepting suggestion via Tab")
                    const accepted = acceptCurrentSuggestion()
                    if (accepted) {
                        return
                    }
                }
                editor.trigger('keyboard', 'tab', null)
            }
        )

        // Escape to reject
        editor.addCommand(monaco.KeyCode.Escape, () => {
            console.log("Esc pressed")
            if (currentSuggestionRef.current) {
                onRejectSuggestion(editor)
                clearCurrentSuggestion()
            }
        })

        // Cursor position changes
        editor.onDidChangeCursorPosition((e: any) => {
            if (isAcceptingSuggestionRef.current) return

            const newPosition = e.position

            if (currentSuggestionRef.current && !suggestionAcceptedRef.current) {
                const suggestionPos = currentSuggestionRef.current.position

                if (
                    newPosition.lineNumber !== suggestionPos.line ||
                    newPosition.column < suggestionPos.column ||
                    newPosition.column > suggestionPos.column + 10
                ) {
                    console.log("Cursor moved away, clearing")
                    clearCurrentSuggestion()
                    onRejectSuggestion(editor)
                }
            }

            if (!currentSuggestionRef.current && !suggestionLoading && isAIEnabled) {
                console.log("⏱️ Cursor moved, setting timeout for suggestion")
                if (suggestionTimeoutRef.current) {
                    clearTimeout(suggestionTimeoutRef.current)
                }
                suggestionTimeoutRef.current = setTimeout(() => {
                    console.log("🚀 Triggering suggestion from cursor move")
                    onTriggerSuggestion("completion", editor, getFileName())
                }, 500)
            }
        })

        // Content changes
        editor.onDidChangeModelContent((e: any) => {
            console.log("✍️ Content changed! Changes:", e.changes.length, "AI enabled:", isAIEnabled)
            
            if (isAcceptingSuggestionRef.current) {
                console.log("Skipping - accepting suggestion")
                return
            }

            if (currentSuggestionRef.current && e.changes.length > 0 && !suggestionAcceptedRef.current) {
                const change = e.changes[0]

                if (
                    change.text === currentSuggestionRef.current.text ||
                    change.text === currentSuggestionRef.current.text.replace(/\r/g, "")
                ) {
                    console.log("Change is our suggestion, not clearing")
                    return
                }

                console.log("User typed, clearing suggestion")
                clearCurrentSuggestion()
            }

            if (e.changes.length > 0 && !suggestionAcceptedRef.current && isAIEnabled) {
                const change = e.changes[0]
                console.log("📝 Change text:", change.text)

                // Only trigger on specific characters, not every keystroke
                if (["\n", "{", ".", "=", "(", ",", ":", ";"].includes(change.text)) {
                    console.log("🎯 Special character detected, triggering suggestion")
                    if (suggestionTimeoutRef.current) {
                        clearTimeout(suggestionTimeoutRef.current)
                    }
                    suggestionTimeoutRef.current = setTimeout(() => {
                        if (editorRef.current && !currentSuggestionRef.current && !suggestionLoading) {
                            console.log("🚀 Triggering suggestion from special char")
                            onTriggerSuggestion("completion", editor, getFileName())
                        }
                    }, 300)
                } else {
                    console.log("⏭️ Not a special character, skipping auto-trigger")
                }
            } else {
                if (!isAIEnabled) console.log("🚫 AI disabled, not triggering")
                if (suggestionAcceptedRef.current) console.log("⏭️ Suggestion already accepted")
            }
        })

        updateEditorLanguage()
    }

    const updateEditorLanguage = () => {
        if (!activeFile || !monacoRef.current || !editorRef.current) return
        const model = editorRef.current.getModel()
        if (!model) return

        const language = getEditorLanguage(activeFile.fileExtension || "")
        try {
            monacoRef.current.editor.setModelLanguage(model, language)
        } catch (error) {
            console.warn("Failed to set editor language", error)
        }
    }

    useEffect(() => {
        updateEditorLanguage()
    }, [activeFile])

    useEffect(() => {
        return () => {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current)
            }
            if (tabCommandRef.current) {
                try {
                    tabCommandRef.current.dispose()
                } catch (e) {
                    console.warn("Failed to dispose tab command:", e)
                }
                tabCommandRef.current = null
            }
            clearDecorations()
        }
    }, [clearDecorations])

    return (
        <div className='h-full relative'>
            {suggestionLoading && isAIEnabled && (
                <div className='absolute top-2 right-2 z-10 bg-blue-100 dark:bg-blue-900 px-3 py-1.5 rounded-md text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 shadow-sm'>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    AI Thinking...
                </div>
            )}

            {currentSuggestionRef.current && !suggestionLoading && isAIEnabled && (
                <div className="absolute top-2 right-2 z-10 bg-green-100 dark:bg-green-900 px-3 py-1.5 rounded-md text-xs text-green-700 dark:text-green-300 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Press <kbd className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs font-mono">Tab</kbd> to accept
                </div>
            )}

            <Editor 
                height={"100%"}
                value={content}  
                key={activeFile?.filename + activeFile?.fileExtension}  
                onChange={(value) => onContentChange(value || "")}
                onMount={handleEditorDidMount}
                language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
                options={defaultEditorOptions}
            />
        </div>
    )
}

export default PlaygroundEditor
