"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const action = mode === "in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-accent">
          Referral Intelligence Engine
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-brand">
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>

        <form action={formAction} className="mt-6 space-y-4">
          {mode === "up" && (
            <Field
              label="Display name"
              name="display_name"
              type="text"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
          />

          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 text-sm text-brand-accent hover:underline"
        >
          {mode === "in"
            ? "Need an account? Create one"
            : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
      />
    </label>
  );
}
