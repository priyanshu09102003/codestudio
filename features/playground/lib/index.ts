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

// Helper to get all possible paths for files with the same name
function findAllFilePaths(
  file: TemplateFile,
  folder: TemplateFolder,
  pathSoFar: string[] = []
): string[] {
  const paths: string[] = [];
  
  for (const item of folder.items) {
    if ("folderName" in item) {
      paths.push(...findAllFilePaths(file, item, [...pathSoFar, item.folderName]));
    } else {
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension
      ) {
        const fullPath = [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
        paths.push(fullPath);
      }
    }
  }
  
  return paths;
}

export function findFilePath(
  file: TemplateFile,
  folder: TemplateFolder,
  pathSoFar: string[] = []
): string | null {
  for (const item of folder.items) {
    if ("folderName" in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
      if (res) return res;
    } else {
      // First try exact object match (for existing files)
      if (item === file) {
        return [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
      }
    }
  }
  
  // Fallback: find by name and content match (for new files)
  for (const item of folder.items) {
    if ("folderName" in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
      if (res) return res;
    } else {
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension &&
        item.content === file.content
      ) {
        return [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
      }
    }
  }
  
  return null;
}

export const generateFileId = (file: TemplateFile, rootFolder: TemplateFolder): string => {
  // Try to find the exact path
  const path = findFilePath(file, rootFolder);
  
  if (path) {
    return path;
  }
  
  // If not found, check if there are multiple files with same name
  const allPaths = findAllFilePaths(file, rootFolder);
  
  if (allPaths.length === 1) {
    // Only one file with this name, use its path
    return allPaths[0];
  }
  
  if (allPaths.length > 1) {
    // Multiple files with same name - need to differentiate
    // Use content hash as tiebreaker
    const contentHash = hashCode(file.content || '');
    return `${allPaths[0]}-${contentHash}`;
  }
  
  // Fallback: generate unique ID
  const extension = file.fileExtension?.trim();
  const extensionSuffix = extension ? `.${extension}` : '';
  return `${file.filename}${extensionSuffix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simple hash function for content
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
