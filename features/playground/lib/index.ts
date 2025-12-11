// import { TemplateFile, TemplateFolder } from "../types";


// export function findFilePath(
//   file: TemplateFile,
//   folder: TemplateFolder,
//   pathSoFar: string[] = []
// ): string | null {
//   for (const item of folder.items) {
//     if ("folderName" in item) {
//       const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
//       if (res) return res;
//     } else {
//       if (
//         item.filename === file.filename &&
//         item.fileExtension === file.fileExtension
//       ) {
//         return [
//           ...pathSoFar,
//           item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
//         ].join("/");
//       }
//     }
//   }
//   return null;
// }

// export const generateFileId = (file: TemplateFile, rootFolder: TemplateFolder): string => {
//   // Find the file's FULL path (already includes filename)
//   const path = findFilePath(file, rootFolder);
  
//   if (!path) {
//     // Fallback: generate unique ID with timestamp
//     const extension = file.fileExtension?.trim();
//     const extensionSuffix = extension ? `.${extension}` : '';
//     return `${file.filename}${extensionSuffix}-${Date.now()}`;
//   }
  
//   // Return the path as-is (it already includes filename.extension)
//   // Example: "app/page.tsx" or "app/SignUp/page.tsx"
//   return path;
// }

import { TemplateFile, TemplateFolder } from "../types";

export function findFilePath(
  file: TemplateFile,
  folder: TemplateFolder,
  pathSoFar: string[] = [],
  contextPath?: string
): string | null {
  // If contextPath is provided, use it to find the exact file
  if (contextPath) {
    const pathParts = contextPath.split('/');
    let currentFolder = folder;
    
    // Navigate to the folder containing the file
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const nextFolder = currentFolder.items.find(
        item => "folderName" in item && item.folderName === part
      ) as TemplateFolder | undefined;
      
      if (!nextFolder) return null;
      currentFolder = nextFolder;
    }
    
    // Find the file in the target folder
    const targetFile = currentFolder.items.find(
      item => "filename" in item && 
      item.filename === file.filename && 
      item.fileExtension === file.fileExtension
    );
    
    if (targetFile) {
      return contextPath;
    }
  }
  
  // Standard recursive search
  for (const item of folder.items) {
    if ("folderName" in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName], contextPath);
      if (res) return res;
    } else {
      if (item.filename === file.filename && item.fileExtension === file.fileExtension) {
        return [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
      }
    }
  }
  
  return null;
}

export const generateFileId = (
  file: TemplateFile,
  rootFolder: TemplateFolder,
  contextPath?: string
): string => {
  // Try to find the file with context path first
  const path = findFilePath(file, rootFolder, [], contextPath);
  
  if (path) {
    return path;
  }
  
  // Fallback: generate unique ID
  const extension = file.fileExtension?.trim();
  const extensionSuffix = extension ? `.${extension}` : '';
  return `${file.filename}${extensionSuffix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
