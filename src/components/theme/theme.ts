export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "ec-theme";

/** Runs inline in <head>: stored choice, else the device setting. Wrapped in try/catch for blocked storage. */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_KEY}");}catch(e){}var d=c==="dark"||(c!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";})()`;

export function applyTheme(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
