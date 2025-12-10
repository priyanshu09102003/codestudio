import { useState, useCallback, useRef } from "react";

interface AISuggestionsState {
    suggestion: string | null;
    isLoading: boolean;
    position: { line: number; column: number } | null;
    decoration: string[];
    isEnabled: boolean;
}

interface useAISuggestonsReturn extends AISuggestionsState {
    toggleEnabled: () => void;
    fetchSuggestion: (type: string, editor: any, fileName?: string) => Promise<void>;
    acceptSuggestion: (editor: any, monaco: any) => void;
    rejectSuggestion: (editor: any) => void;
    clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): useAISuggestonsReturn => {
    const [state, setState] = useState<AISuggestionsState>({
        suggestion: null,
        isLoading: false,
        position: null,
        decoration: [],
        isEnabled: false
    });

    // Use ref to track enabled state for callbacks
    const isEnabledRef = useRef(false);

    const toggleEnabled = useCallback(() => {
        setState((prev) => {
            const newEnabled = !prev.isEnabled;
            isEnabledRef.current = newEnabled;
            console.log("🔴 AI Assistance toggled:", newEnabled ? "ENABLED" : "DISABLED");
            console.log("🔴 New state will be:", newEnabled);
            return { ...prev, isEnabled: newEnabled };
        });
    }, []);

    const fetchSuggestion = useCallback(async (type: string, editor: any, fileName?: string) => {
        // Check if AI Suggestion is Enabled using ref (always current value)
        if (!isEnabledRef.current) {
            console.log("AI Assistance is Disabled - skipping suggestion");
            return;
        }

        if (!editor) {
            console.warn("Editor instance is not available");
            return;
        }

        // Get the cursor position and suggestion
        const model = editor.getModel();
        const cursorPosition = editor.getPosition();

        if (!model || !cursorPosition) {
            console.warn("Editor Model or Cursor Position is not available");
            return;
        }

        // Set the loading state
        setState(prev => ({ ...prev, isLoading: true }));

        // Perform the async operation for POST Request
        try {
            const payload = {
                fileContent: model.getValue(),
                cursorLine: cursorPosition.lineNumber - 1,
                cursorColumn: cursorPosition.column - 1,
                suggestionType: type,
                fileName: fileName || 'file.js',
            };
            console.log("Fetching AI suggestion...", payload.fileName);

            const response = await fetch("/api/code-suggestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();
            console.log("API response received:", data.suggestion ? "✓ Got suggestion" : "✗ No suggestion");

            if (data.suggestion) {
                const suggestionText = data.suggestion.trim();
                setState((prev) => ({
                    ...prev,
                    suggestion: suggestionText,
                    position: {
                        line: cursorPosition.lineNumber,
                        column: cursorPosition.column,
                    },
                    isLoading: false,
                }));
                console.log("Suggestion set successfully");
            } else {
                console.warn("No suggestion received from API.");
                setState((prev) => ({ ...prev, isLoading: false, suggestion: null }));
            }
        } catch (error) {
            console.error("Error fetching code suggestion:", error);
            setState((prev) => ({ ...prev, isLoading: false, suggestion: null }));
        }
    }, []); // Remove state.isEnabled from dependencies

    const acceptSuggestion = useCallback((editor: any, monaco: any) => {
        setState((currentState) => {
            if (!currentState.suggestion || !currentState.position || !editor || !monaco) {
                return currentState;
            }

            const { line, column } = currentState.position;
            const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, "");

            editor.executeEdits("", [
                {
                    range: new monaco.Range(line, column, line, column),
                    text: sanitizedSuggestion,
                    forceMoveMarkers: true,
                },
            ]);

            if (editor && currentState.decoration.length > 0) {
                editor.deltaDecorations(currentState.decoration, []);
            }

            console.log("Suggestion accepted and inserted");

            return {
                ...currentState,
                suggestion: null,
                position: null,
                decoration: []
            };
        });
    }, []);

    const rejectSuggestion = useCallback((editor: any) => {
        setState((currentState) => {
            if (editor && currentState.decoration.length > 0) {
                editor.deltaDecorations(currentState.decoration, []);
            }
            console.log("Suggestion rejected");
            return {
                ...currentState,
                suggestion: null,
                position: null,
                decoration: [],
            };
        });
    }, []);

    const clearSuggestion = useCallback((editor: any) => {
        setState((currentState) => {
            if (editor && currentState.decoration.length > 0) {
                editor.deltaDecorations(currentState.decoration, []);
            }
            console.log("Suggestion cleared");
            return {
                ...currentState,
                suggestion: null,
                position: null,
                decoration: [],
            };
        });
    }, []);

    // Sync ref with state
    isEnabledRef.current = state.isEnabled;

    return {
        ...state,
        toggleEnabled,
        fetchSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        clearSuggestion,
    };
};