import { useEffect, useState, useCallback } from "react";
import { me } from "../api/admin";

export function useAuth() {
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(null);

  const load = useCallback(async () => {
    try {
      const { admin } = await me();
      setAdmin(admin);
    } catch {
      setAdmin(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setToken = (token) => {
    if (token) sessionStorage.setItem("adminToken", token);
    else sessionStorage.removeItem("adminToken");
  };

  return { ready, admin, setToken, reload: load };
}
