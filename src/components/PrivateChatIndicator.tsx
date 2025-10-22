import { Lock, Sparkles } from "lucide-react";
import "./PrivateChatIndicator.css";

interface PrivateChatIndicatorProps {
  isPrivate: boolean;
}

export const PrivateChatIndicator = ({ isPrivate }: PrivateChatIndicatorProps) => {
  if (!isPrivate) return null;

  return (
    <div className="private-chat-indicator" role="status" aria-live="polite">
      <div className="private-chat-orbit" aria-hidden="true" />
      <div className="private-chat-card">
        <div className="private-chat-icon">
          <span className="private-chat-icon-glow" aria-hidden="true" />
          <span className="private-chat-icon-inner">
            <Lock className="private-chat-icon-lock" aria-hidden="true" />
          </span>
        </div>

        <div className="private-chat-copy">
          <div className="private-chat-eyebrow">
            <Sparkles className="private-chat-eyebrow-icon" aria-hidden="true" />
            <span>Incognito mode</span>
          </div>
          <h3 className="private-chat-title">Greetings, whoever you are</h3>
          <p className="private-chat-subcopy">
            This conversation stays in the moment. Messages aren't stored or used to train models.
          </p>
        </div>

        <span className="private-chat-pill">Private</span>
      </div>
    </div>
  );
};
