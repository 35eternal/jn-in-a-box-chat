import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatHeaderProps {
  name: string;
  status: string;
  avatarUrl: string;
}

export const ChatHeader = ({ name, status, avatarUrl }: ChatHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-[hsl(174,45%,20%)] to-[hsl(164,55%,25%)] px-4 py-3 flex items-center gap-3 border-b border-white/10 rounded-t-lg">
      <Avatar className="h-10 w-10">
        <AvatarImage 
          src={avatarUrl} 
          alt={name}
          style={{
            objectFit: 'cover',
            objectPosition: 'center 20%'
          }}
        />
        <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <h2 className="text-white font-semibold text-base">{name}</h2>
        <p className="text-white/70 text-xs">{status}</p>
      </div>
    </div>
  );
};
