import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboard() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const continueToApp = () => {
    if (username.trim()) {
      localStorage.setItem("anotequest_username", username);
    }
    navigate("/app");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold mb-4">Choose a username</h2>

        <p className="text-gray-500 mb-6">
          Save your workspace and access it anywhere.
        </p>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full border rounded-xl px-4 py-3 mb-4"
        />

        <button onClick={continueToApp} className="btn-primary w-full mb-3">
          Continue
        </button>

        <button
          onClick={() => navigate("/app")}
          className="text-sm text-gray-400"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
