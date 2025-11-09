import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

export function NewChatModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (userId: string) => void }) {
  const [userId, setUserId] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4">Start New Chat</h2>
        <Input label="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <div className="flex gap-2 mt-4">
          <Button variant="primary" onClick={() => onCreate(userId)} disabled={!userId.trim()}>Start Chat</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
