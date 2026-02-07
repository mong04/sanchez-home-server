import React, { useState } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import { addFeedback } from "../../lib/feedback-store";

export const FeedbackFab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"bug" | "feature">("bug");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) return;

        addFeedback({
            subject,
            description,
            type,
        });

        // Reset and close
        setSubject("");
        setDescription("");
        setType("bug");
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                layout
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                aria-label="Send Feedback"
            >
                <MessageSquarePlus className="h-6 w-6" />
            </motion.button>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="w-full max-w-md overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-border"
                        >
                            <div className="flex items-center justify-between border-b p-4">
                                <h2 className="text-lg font-semibold">Send Feedback</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setType("bug")}
                                            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${type === "bug"
                                                    ? "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                }`}
                                        >
                                            🐞 Bug Report
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType("feature")}
                                            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${type === "feature"
                                                    ? "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                }`}
                                        >
                                            💡 Feature Idea
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">
                                        Subject
                                    </label>
                                    <input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief summary..."
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="What happened? Or what would you like to see?"
                                        className="h-24 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" className="gap-2">
                                        <Send className="h-4 w-4" />
                                        Send Feedback
                                    </Button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Backdrop click to close */}
                        <div
                            className="absolute inset-0 -z-10"
                            onClick={() => setIsOpen(false)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
