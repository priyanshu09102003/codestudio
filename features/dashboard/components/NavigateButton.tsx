import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'
import React from 'react'
import Image from 'next/image'

const NavigateButton = () => {
  return (
    <div>
     <a href="https://www.google.com">
         <div
        className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
            transition-all duration-300 ease-in-out
            hover:bg-background hover:border-[#E93F3F] hover:scale-[1.02]
            shadow-[0_2px_10px_rgba(0,0,0,0.08)]
            hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]"
        >
        <div className='flex flex-row justify-center items-start gap-4'>

            <Button variant={"outline"}
            className="flex justify-center items-center bg-white group-hover:bg-[#fff8f8] group-hover:border-[#E93F3F] group-hover:text-[#E93F3F] transition-colors duration-300"
            size={"icon"}
            >

                <ArrowRight size={30} className="transition-transform duration-300 group-hover:rotate-320"/>

            </Button>

            <div className='flex flex-col'>

                <h1 className="text-xl font-bold text-[#e93f3f]">
                    AutoBuild
                </h1>

                <p className="text-sm text-muted-foreground max-w-[220px]">
                    Build with prompts
                </p>
                

            </div>

        </div>


            <div className='relative overflow-hidden'>
                <Image src="/autobuild.svg"  alt="Autobuild"
                width={150}
                height={150}
                className="transition-transform duration-300 group-hover:scale-110" />
            </div>

        </div>
     </a>
    </div>
  )
}

export default NavigateButton
