import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/admin";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";

export default function Login({ onLogin }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mLogin = useMutation({
    mutationFn: () => loginAdmin(email, password),
    onSuccess: ({ token }) => {
      // simpan token & lanjut
      localStorage.setItem("admin_token", token);
      if (typeof onLogin === "function") onLogin(token);
      // arahkan ke dashboard admin
      nav("/admin", { replace: true });
    },
  });

  const submit = (e) => {
    e.preventDefault();
    mLogin.mutate();
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card title="Login Admin">
        <form onSubmit={submit} className="w-[320px] space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="taufiq@wbi.ac.id"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
          {mLogin.isError && (
            <div className="text-red-400 text-sm">
              {mLogin.error?.response?.data?.message || "Login gagal"}
            </div>
          )}
          <Button className="w-full" type="submit" disabled={mLogin.isLoading}>
            {mLogin.isLoading ? "Masuk..." : "Masuk"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
