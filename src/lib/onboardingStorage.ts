const EXPLORE_TOUR_KEY = "ranqly_explore_tour_v1_done";
const DASHBOARD_HINT_KEY = "ranqly_dashboard_welcome_v1_done";

export function isExploreTourDone(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(EXPLORE_TOUR_KEY) === "1";
}

export function setExploreTourDone(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXPLORE_TOUR_KEY, "1");
}

export function isDashboardWelcomeDone(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DASHBOARD_HINT_KEY) === "1";
}

export function setDashboardWelcomeDone(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_HINT_KEY, "1");
}
