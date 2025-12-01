"use server"

import { currentUser } from "@/features/auth/actions"
import { db } from "@/lib/db"
import { Templates } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const createPlayground = async(data: {
    title: string;
    template: Templates;
    description?: string;
})=>{
    const {template, title, description} = data;
    const user = await currentUser();

    try {
       const playground = await db.playground.create({
        data:{
            title,
            description,
            template,
            userId:user?.id!
        }
       })

       return playground;


    } catch (error) {
        console.log(error)
        return null;
    }
}

export const getAllPlaygrounds = async()=>{
    const user = await currentUser();


    try {
        const playground = await db.playground.findMany({
            where:{
                userId: user?.id
            },
            include:{
               user: true,
               Starmark:{
                where:{
                    userId : user?.id
                },
                select:{
                    isMarked: true
                }
               } 
            }
        })

        return playground;
        
    } catch (error) {

        console.error(error);
        
    }
}

export const deleteProjectById = async(id:string) =>{
    try {
        await db.playground.delete({
            where:{id}
        })

        revalidatePath("/dashboard")


    } catch (error) {
        console.error(error);
    }
}


export const editProjectById = async(id:string, data:{title:string, description:string})=>{
    try {
        await db.playground.update({
            where:{id},
            data:data
        })

    } catch (error) {

        console.error(error)
        
    }
}

export const duplicateProjectById = async(id:string)=>{
    try {
        const originalPlaygroundData = await db.playground.findUnique({
            where: {id},
        })

        if(!originalPlaygroundData){
            throw new Error("Playground not found");
        }

        const duplicatedPlayground = await db.playground.create({
            data:{
                title: `${originalPlaygroundData.title} (Copy)`,
                description: originalPlaygroundData.description,
                template: originalPlaygroundData.template,
                userId: originalPlaygroundData.userId
            }
        })

        
        revalidatePath("/dashboard");

        return duplicatedPlayground;


    } catch (error) {
        console.error(error);
        return null;
    }
}