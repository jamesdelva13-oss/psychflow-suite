"use client";

import { useActionState } from "react";
import { Button, Eyebrow, Field } from "@suite/ui";
import { signIn, type AuthState } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, null);

  return (
    <main className="auth-page">
      <div className="auth-card panel">
        <Eyebrow>Psych Suite</Eyebrow>
        <h1 className="page-title">Sign in to PsychReport</h1>
        <p className="page-sub">Use your Psych Suite account.</p>
        <form action={formAction} className="stack auth-card__form">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={state?.error ?? null}
          />
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
