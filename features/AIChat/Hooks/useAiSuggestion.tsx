import { useState , useCallback} from "react";


interface AISuggestionsState{
    suggestion: string | null;
    isLoading: boolean;
    position: {line: number; column:number} | null;
    decoration: string[];
    isEnabled: boolean;
}

interface useAISuggestonsReturn extends AISuggestionsState{
    toggleEnabled: () => void;
    fetchSuggestion: (type: string, editor:any)=>Promise<void>;
    acceptSuggestion: (editor: any, monaco: any) => void;
    rejectSuggestion: (editor: any) => void;
    clearSuggestion: (editor: any) => void;
    
}


export const useAISuggestions = ():useAISuggestonsReturn=>{
    const [state, setState] = useState<AISuggestionsState>({
        suggestion:null,
        isLoading: false,
        position:null,
        decoration: [],
        isEnabled: true
    });

    const toggleEnabled = useCallback(() => {
        setState((prev)=>({...prev, isEnabled: !prev.isEnabled}))
    }, []);

    const fetchSuggestion = useCallback(async(type: string, editor:any)=>{

        //Step1: Check if AI Suggestion is Enabled or not

        setState((currenState)=> {
            if(!currenState.isEnabled){
                console.warn("AI Assistance is Disabled")
                return currenState;
            }

            if(!editor){
                console.warn("Editor instance is not available");
                return currenState;
            }

            //Step2: Get the cursor position and suggestioning
            const model = editor.getModel();
            const cursorPosition = editor.getPosition();

            if(!model || !cursorPosition){
                console.warn("Editor Model or Cursor Position is not available");
                return currenState;
            }


            //Set the loading state


            //@ts-ignore
            const newState = {...currenState, isLoading: true}


            //Perform the async operation for POST Request

            (async () => {
            try {
            const payload = {
                fileContent: model.getValue(),
                cursorLine: cursorPosition.lineNumber - 1,
                cursorColumn: cursorPosition.column - 1,
                suggestionType: type,
            };
            console.log("Request payload:", payload);

            const response = await fetch("/api/code-suggestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }

            const data = await response.json();
            console.log("API response:", data);

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
            } else {
                console.warn("No suggestion received from API.");
                setState((prev) => ({ ...prev, isLoading: false }));
            }
            } catch (error) {
            console.error("Error fetching code suggestion:", error);
            setState((prev) => ({ ...prev, isLoading: false }));
            }
        })();

            return newState;
        })
    }, [])

    const acceptSuggestion = useCallback(()=>{
        (editor: any, monaco:any)=>{
            setState((currentState)=>{
                if(!currentState.suggestion || !currentState.position || !editor || !monaco){
                    return currentState;
                }

                const {line, column} = currentState.position;
                const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, "")

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

                return{
                    ...currentState,
                    suggestion: null,
                    position: null,
                    decoration: []
                }
            })
        }
    },[])

    const rejectSuggestion = useCallback((editor: any) => {
        setState((currentState) => {
        if (editor && currentState.decoration.length > 0) {
            editor.deltaDecorations(currentState.decoration, []);
        }
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
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
     ...state,
        toggleEnabled,
        fetchSuggestion,
        acceptSuggestion,
        rejectSuggestion,
        clearSuggestion,
  }
}

