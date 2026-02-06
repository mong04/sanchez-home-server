export const SECURITY_CONFIG = {
    // Content Security Policy directives
    CSP: {
        DEFAULT_SRC: "'self'",
        CONNECT_SRC: "'self' ws://localhost:* wss://signaling.yjs.dev wss://sanchez-family-os-sync.mong04.partykit.dev https://sanchez-family-os-sync.mong04.partykit.dev",
        STYLE_SRC: "'self' 'unsafe-inline'",
        SCRIPT_SRC: "'self' 'unsafe-inline'", // Required for some dev tooling
        IMG_SRC: "'self' data: blob:",
        FONT_SRC: "'self' fonts.googleapis.com fonts.gstatic.com",
    },
    // Sanitization config (e.g. for DOMPurify)
    SANITIZER: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
    }
} as const;
