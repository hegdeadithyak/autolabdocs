"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { api } from "../../lib/api";

const SignUpPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError("All fields required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.register(name, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] transition-shadow duration-500 hover:shadow-[0_0_60px_-10px_rgba(59,130,246,0.6)]">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign Up</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:bg-zinc-900 outline-none transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:bg-zinc-900 outline-none transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:bg-zinc-900 outline-none transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              "Signing Up..."
            ) : (
              <>
                Sign Up <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-4">
          Have account?{" "}
          <a href="/signin" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
