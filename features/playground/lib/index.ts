import { TemplateFile, TemplateFolder } from "../types";


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
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension
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
  // Find the file's FULL path (already includes filename)
  const path = findFilePath(file, rootFolder);
  
  if (!path) {
    // Fallback: generate unique ID with timestamp
    const extension = file.fileExtension?.trim();
    const extensionSuffix = extension ? `.${extension}` : '';
    return `${file.filename}${extensionSuffix}-${Date.now()}`;
  }
  
  // Return the path as-is (it already includes filename.extension)
  // Example: "app/page.tsx" or "app/SignUp/page.tsx"
  return path;
}
