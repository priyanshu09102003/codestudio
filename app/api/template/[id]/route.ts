import { readTemplateStructureFromJson, saveTemplateStructureToJson } from "@/features/playground/lib/path-to-json";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises"
import { NextRequest, NextResponse } from "next/server";
import { templatePaths } from "@/lib/template";

// Helper function to ensure valid JSON
function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data)); // Ensures it's serializable
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    const {id} = await params;

    if(!id){
        return NextResponse.json({error: "Missing Playground ID"}, {status: 400})
    }

    const playground = await db.playground.findUnique({
        where: { id }
    })

    if(!playground){
        return NextResponse.json({error: "Playground not found"}, {status: 404})
    }

    const templateKey = playground.template as keyof typeof templatePaths
    const templatePath = templatePaths[templateKey]

    if(!templatePath){
        return NextResponse.json({error: "Invalid template"}, {status: 404});
    }

    try {
        const inputPath = path.join(process.cwd(), templatePath);
        
        // Use /tmp for Vercel serverless compatibility
        const outputDir = path.join('/tmp', 'output');
        const outputFile = path.join(outputDir, `${templateKey}.json`);

        // Ensure /tmp/output exists
        await fs.mkdir(outputDir, { recursive: true });

        await saveTemplateStructureToJson(inputPath, outputFile);
        const result = await readTemplateStructureFromJson(outputFile);

        // Validate JSON Structure
        if(!validateJsonStructure(result.items)){
            // Clean up before returning error
            await fs.unlink(outputFile).catch(() => {});
            return NextResponse.json({error: "Invalid JSON Structure"}, {status: 500})
        }

        // Clean up temp file
        await fs.unlink(outputFile).catch(err => {
            console.warn("Failed to delete temp file:", err);
        });

        return NextResponse.json(
            { success: true, templateJson: result }, 
            { 
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=3600',
                }
            }
        );

    } catch (error) {
        console.error("Error generating template JSON:", error);
        return NextResponse.json(
            { 
                error: "Failed to generate template",
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}
