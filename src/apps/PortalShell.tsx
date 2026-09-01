import { useEffect, useState } from "react";
import AmbassadorApp from "./ambassador/AmbassadorApp";
import PartnerApp from "./partner/PartnerApp";
import { LandingPage, PortalLoginPage, PartnerRegisterPage } from "../public/PublicPages";

type PublicRoute = "/" | "/login" | "/register" | "/partner" | "/ambassador";

function readRoute(): PublicRoute {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (["/login", "/register", "/partner", "/ambassador"].includes(path)) {
    return path as PublicRoute;
  }
  return "/";
}

export default function PortalShell() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to: PublicRoute) => {
    if (window.location.pathname !== to) window.history.pushState({}, "", to);
    setRoute(to);
  };

  if (route === "/partner") return <PartnerApp />;
  if (route === "/ambassador") return <AmbassadorApp />;
  if (route === "/login") return <PortalLoginPage onNavigate={navigate} />;
  if (route === "/register") return <PartnerRegisterPage onNavigate={navigate} />;
  return <LandingPage onNavigate={navigate} />;
}
