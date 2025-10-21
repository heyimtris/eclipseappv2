import React from "react";
import { Avatar } from "./avatar";

export function GroupChatAvatar({ members }: { members: any[] }) {
  // Show up to 3 avatars, overlapping diagonally
  const displayed = members.slice(0, 3);
  // Stack diagonally, centered in a 40x40 box
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 40, width: 40, position: "relative" }}>
      <div style={{ position: "relative", height: 40, width: 40 }}>
        {displayed.map((member, i) => (
          <div
            key={member._id || i}
            style={{
              position: "absolute",
              left: i * 10,
              top: i * 10,
              zIndex: 10 - i,
              width: 28,
              height: 28,
              borderRadius: "50%",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              background: "#222222",
              overflow: "hidden"
            }}
          >
            <img 
              src={member.avatar === "default.png" ? "/pingu.jpg" : member.avatar || "/pingu.jpg"}
              alt={member.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
