"use server"

import { currentUser } from "@/features/auth/actions"
import { db } from "@/lib/db"
import { Templates } from "@prisma/client";

export const createPlayground = async(data: {
    title: string;
    template: Templates;
    description?: string;
    userId: string
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

        return null;
        
    }
}