import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  User,
  Copy,
  Check,
  X,
  Paperclip,
  FileText,
  Code,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Plus,
  Minus,
  Settings,
  Zap,
  Brain,
  Terminal,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import "katex/dist/katex.min.css";


interface FileAttachment {
  id: string;
  name: string;
  content: string;
  language: string;
  size: number;
  type: "code";
  preview?: string;
  mimeType?: string;
}

interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  insertPosition?: { line: number; column: number };
  fileName?: string;
  confidence?: number;
  category?: "optimization" | "bug_fix" | "feature" | "refactor" | "security";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  suggestions?: CodeSuggestion[];
  type?: "chat" | "code_review" | "suggestion" | "error_fix" | "optimization";
  tokens?: number;
  model?: string;
}

interface AIChatSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCode?: (
    code: string,
    fileName?: string,
    position?: { line: number; column: number }
  ) => void;
  onRunCode?: (code: string, language: string) => void;
  activeFileName?: string;
  activeFileContent?: string;
  activeFileLanguage?: string;
  cursorPosition?: { line: number; column: number };
  theme?: "dark" | "light";
}





const AIChatSidePanel = ({

    isOpen,
    onClose,
    onInsertCode,
    onRunCode,
    activeFileName,
    activeFileContent,
    activeFileLanguage,
    cursorPosition,
    theme = "dark",

}: AIChatSidePanelProps) => {

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [chatMode, setChatMode] = useState<
        "chat" | "review" | "fix" | "optimize"
    >("chat");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [showSettings, setShowSettings] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [streamResponse, setStreamResponse] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
        scrollToBottom();
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [messages, isLoading]);




  return (
    <div>
      
    </div>
  )
}

export default AIChatSidePanel
