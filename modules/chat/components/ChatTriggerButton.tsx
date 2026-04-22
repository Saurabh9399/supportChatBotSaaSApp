"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTriggerButtonProps {
  isOpen: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export function ChatTriggerButton({ isOpen, unreadCount = 0, onClick }: ChatTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close support chat" : "Open support chat"}
      className={cn(
        "relative w-14 h-14 rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-blue-600 to-indigo-600",
        "shadow-chat-button hover:shadow-lg",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-4 focus:ring-blue-500/30",
        "hover:scale-105 active:scale-95",
        !isOpen && "animate-bounce-soft",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-200",
          isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75",
        )}
      >
        <X className="w-6 h-6 text-white" />
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-200",
          isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100",
        )}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
