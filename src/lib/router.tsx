import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface RouterActions {
  push: (url: string) => void;
  replace: (url: string) => void;
  refresh: () => void;
  back: () => void;
  forward: () => void;
}

interface RouterContextType extends RouterActions {
  pathname: string;
  actions: RouterActions;
}

const noop = () => {};
const defaultActions: RouterActions = {
  push: noop,
  replace: noop,
  refresh: noop,
  back: noop,
  forward: noop,
};

const RouterContext = createContext<RouterContextType>({
  pathname: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
  ...defaultActions,
  actions: defaultActions,
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname || "/" : "/"
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const push = useCallback((url: string) => {
    if (url.startsWith("#")) {
      try {
        window.location.hash = url;
      } catch {}
      return;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        window.location.href = url;
      } catch {}
      return;
    }
    const targetPath = url.split("?")[0].split("#")[0] || "/";
    try {
      window.history.pushState({}, "", url);
    } catch {
      // Ignored in sandboxed iframe
    }
    setPathname(targetPath);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }, []);

  const replace = useCallback((url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        window.location.replace(url);
      } catch {}
      return;
    }
    const targetPath = url.split("?")[0].split("#")[0] || "/";
    try {
      window.history.replaceState({}, "", url);
    } catch {
      // Ignored in sandboxed iframe
    }
    setPathname(targetPath);
  }, []);

  const refresh = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent("app:refresh"));
    } catch {}
  }, []);

  const back = useCallback(() => window.history.back(), []);
  const forward = useCallback(() => window.history.forward(), []);

  const actions = useMemo<RouterActions>(
    () => ({ push, replace, refresh, back, forward }),
    [push, replace, refresh, back, forward]
  );

  const contextValue = useMemo<RouterContextType>(
    () => ({ pathname, ...actions, actions }),
    [pathname, actions]
  );

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  return ctx.actions;
}

export function usePathname() {
  const ctx = useContext(RouterContext);
  return ctx.pathname;
}

export function useSearchParams() {
  return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
}

export function redirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
}

export function Link({ href, children, onClick, ...props }: LinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !props.target) {
      if (href.startsWith("/") && !href.startsWith("//")) {
        e.preventDefault();
        router.push(href);
      }
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export default Link;
