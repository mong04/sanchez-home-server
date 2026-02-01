import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../hooks/use-theme"

// Actually, I should check Button.tsx. I will use a standard button with classes for now to avoid circular deps or verify Button.tsx first. 
// But the list said update Button.tsx later. I'll simply use standard button with classes to be safe, OR check if Button is ready.
// Better: standard button for now, refactor to UI Button later if needed, but the plan said ThemeToggle is new.
// The user wants "Accessible toggle button".

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Toggle theme"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
