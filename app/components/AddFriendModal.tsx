import React, { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

export function AddFriendModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (username: string) => void }) {
  const [username, setUsername] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add Friend</h2>
        <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <div className="flex gap-2 mt-4">
          <Button variant="primary" onClick={() => onAdd(username)} disabled={!username.trim()}>Add Friend</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
