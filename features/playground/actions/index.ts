"use server";

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import { TemplateFolder } from "../lib/path-to-json";
import { revalidatePath } from "next/cache";


export const getPlaygroundById = async (id: string) => {
    console.log("=== getPlaygroundById called with id:", id); // DEBUG
    
    if (!id) {
        console.error("No ID provided");
        return null;
    }

    try {
        const playground = await db.playground.findUnique({
            where: {id},
            select: {
                title:true,
                description:true,
                templateFiles:{
                    select:{
                        content: true
                    }
                }
            }
        })

        console.log("=== Query result:", playground); // DEBUG
        
        if (!playground) {
            console.error("Playground not found for id:", id);
            return null;
        }

        return playground

    } catch (error) {
        console.error("=== Error in getPlaygroundById:", error);
        return null;  // IMPORTANT: Return null on error
    }
}

export const saveUpdatedCode = async (playgroundId: string , data:TemplateFolder) => {
    const user = await currentUser();

    if(!user) return null;

    try {
        const updatedPlayground = await db.templateFile.upsert({
            where:{
                playgroundId
            },
            update:{
                content: JSON.stringify(data) as any
            },
            create:{
                playgroundId,
                content: JSON.stringify(data) as any
            }
        })
        
        revalidatePath(`/playground/${playgroundId}`);
        return updatedPlayground;
        
    } catch (error) {
        console.error("Error in saveUpdatedCode:", error);
        throw error;
    }
}