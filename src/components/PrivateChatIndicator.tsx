import { Lock } from "lucide-react";

interface PrivateChatIndicatorProps {
  isPrivate: boolean;
}

export const PrivateChatIndicator = ({ isPrivate }: PrivateChatIndicatorProps) => {
  if (!isPrivate) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-6 px-4 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
        <div className="relative flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg px-6 py-3">
          <Lock className="h-5 w-5 text-orange-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-orange-300 font-semibold text-sm">Incognito chat</span>
            <span className="text-orange-200/70 text-xs">This chat isn't saved to history or used to train models.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
