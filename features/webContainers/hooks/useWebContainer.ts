import { useState, useEffect, useCallback } from "react";
import {WebContainer} from "@webcontainer/api"
import { TemplateFolder } from "@/features/playground/lib/path-to-json";


let globalWebContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getWebContainerInstance(): Promise<WebContainer> {
    // If already booted, return it
    if (globalWebContainerInstance) {
        return globalWebContainerInstance;
    }
    
    // If currently booting, wait for it
    if (bootPromise) {
        return bootPromise;
    }
    
    // Boot new instance
    bootPromise = WebContainer.boot();
    try {
        globalWebContainerInstance = await bootPromise;
        return globalWebContainerInstance;
    } catch (error) {
        bootPromise = null;
        throw error;
    }
}
// END OF ADDED LINES


interface useWebContainerProps{
    templateData: TemplateFolder;
}

interface useWebContainerReturn{
    serverUrl: string | null;
    isLoading: boolean;
    error: string | null;
    instance: WebContainer | null;
    writeFileSync: (path:string, content: string) => Promise<void>;
    destroy: () => void;
}


export const useWebContainer = ({templateData} : useWebContainerProps):useWebContainerReturn => {
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [instance, setInstance] = useState<WebContainer | null>(null)

    useEffect(()=> {
        let mounted = true;

        async function initialiseWebContainer(){
            try {
                // CHANGE THIS LINE - use the singleton getter instead of direct boot
                const webcontainerInstance = await getWebContainerInstance();
                if(!mounted) return;

                setInstance(webcontainerInstance);

                setIsLoading(false);

            } catch (error) {

                console.error("Failed to initialize WebContainer: ", error);
                if(mounted){
                    setError(error instanceof Error ? error.message : "Failed to initialize WebContainer");
                    setIsLoading(false)
                }
                
            }
        }

        initialiseWebContainer();

        //If not mounted, cleanup function
        return () => {
            mounted = false;
            // REMOVE teardown from here - don't destroy the global instance
            // if(instance){
            //     instance.teardown();
            // }

        }
    }, [])

    const writeFileSync = useCallback(async(path:string, content: string): Promise<void> => {
        if(!instance){
            throw new Error("WebContainer instance not available")
        }

        try {
            const pathParts = path.split("/")
            const folderPath = pathParts.slice(0, -1).join("/")


            if(folderPath){
                await instance.fs.mkdir(folderPath, {recursive:true})
            }

            await instance.fs.writeFile(path, content)
        } catch (err) {

            const errorMessage = err instanceof Error ? err.message : 'Failed to write file';
            console.error(`Failed to write file at ${path}:`, err);
            throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
            
        }
    }, [instance]);

    const destroy = useCallback(() => {
        if(instance){
            instance.teardown()
            setInstance(null)
            setServerUrl(null)
            // Also clear global instance
            globalWebContainerInstance = null;
            bootPromise = null;
        }
    }, [instance])

    return{
        destroy,
        error,
        instance,
        isLoading,
        serverUrl,
        writeFileSync
    }
}