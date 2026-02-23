
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { compressImage } from '../../utils/image-compression';

interface AvatarEditorProps {
    currentAvatar?: { type: 'preset' | 'upload', value: string };
    onSave: (type: 'preset' | 'upload', value: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = {
    'Animals': [
        ...new Set([
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦆', '🦢', '🦉', '🦚', '🦜', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲'
        ])
    ].filter(e => e.length < 5),
    'People': [
        ...new Set([
            '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👱‍♀️', '👱', '👱‍♂️', '👸', '🤴', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧔', '👼', '🤶', '🎅', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧙‍♀️', '🧙', '🧙‍♂️'
        ])
    ],
    'Fantasy': [
        ...new Set([
            '👾', '👽', '🤖', '👻', '💀', '☠️', '👺', '👹', '👿', '😈', '🤡', '💩', '🌟', '🌠', '🌈', '⚡', '🔥', '💥', '✨', '💫', '🦠', '🧬', '🧠', '🎃', '🔮', '🎮', '🕹️', '🎰', '🎲', '♟️', '🛸', '🚀', '🪐', '🔭'
        ])
    ],
    'Food': [
        ...new Set([
            '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '☕', '🍵', '🧃', '🥤', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🧊'
        ])
    ],
    'Activities': [
        ...new Set([
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤾‍♀️', '🤾', '🤾‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🧘‍♀️', '🧘', '🧘‍♂️', '🧖‍♀️', '🧖', '🧖‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🏇', '🚴‍♀️', '🚴', '🚴‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'
        ])
    ]
};

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ currentAvatar, onSave, onClose }) => {
    const [selectedType, setSelectedType] = useState<'preset' | 'upload'>(currentAvatar?.type || 'preset');
    const [selectedValue, setSelectedValue] = useState<string>(currentAvatar?.value || EMOJI_CATEGORIES['Animals'][0]);
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Animals');
    const [uploadPreview, setUploadPreview] = useState<string | null>(currentAvatar?.type === 'upload' ? currentAvatar.value : null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePresetSelect = (preset: string) => {
        setSelectedType('preset');
        setSelectedValue(preset);
        setUploadPreview(null);
        setError(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        setError(null);

        try {
            const compressedBase64 = await compressImage(file);
            setUploadPreview(compressedBase64);
            setSelectedType('upload');
            setSelectedValue(compressedBase64);
        } catch (err) {
            console.error('Compression failed:', err);
            setError('Failed to process image. Please try a different file.');
        } finally {
            setIsCompressing(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;

        if (selectedType === 'upload' && !uploadPreview) {
            setError('Please upload an image first.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(selectedType, selectedValue);
            onClose();
        } catch (err) {
            console.error("Failed to save avatar:", err);
            setError("Failed to save. Please try again.");
            setIsSaving(false);
        }
    };


    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative bg-card/90 backdrop-blur-xl w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-border">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                        Customize Avatar
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        disabled={isSaving}
                        aria-label="Close dialog"
                    >
                        <span className="text-xl leading-none">✕</span>
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">

                    {/* Preview Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 flex items-center justify-center overflow-hidden border-4 border-background shadow-xl ring-4 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
                                {selectedType === 'preset' ? (
                                    <span className="text-6xl animate-bounce-subtle filter drop-shadow-lg">{selectedValue}</span>
                                ) : (
                                    uploadPreview ? (
                                        <img src={uploadPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-muted-foreground">?</span>
                                    )
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background scale-90 group-hover:scale-100 transition-transform">
                                <span className="text-xs font-bold">XP</span>
                            </div>
                        </div>
                    </div>

                    {/* Segmented Control */}
                    <div className="bg-muted p-1.5 rounded-2xl flex relative">
                        <button
                            onClick={() => setSelectedType('preset')}
                            disabled={isSaving}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10 ${selectedType === 'preset'
                                ? 'bg-background text-primary shadow-sm scale-[1.02]'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Choose Emoji
                        </button>
                        <button
                            onClick={() => setSelectedType('upload')}
                            disabled={isSaving}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10 ${selectedType === 'upload'
                                ? 'bg-background text-primary shadow-sm scale-[1.02]'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Upload Photo
                        </button>
                    </div>

                    {/* Main Selection Area */}
                    <div className="min-h-[220px]">
                        {selectedType === 'preset' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Category Chips (Horizontal Scroll) */}
                                <div className="flex gap-2 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide snap-x">
                                    {(Object.keys(EMOJI_CATEGORIES) as Array<keyof typeof EMOJI_CATEGORIES>).map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start border ${selectedCategory === category
                                                ? 'bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/25 transform scale-105'
                                                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-muted'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>

                                {/* Emoji Grid */}
                                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2 sm:gap-3">
                                    {EMOJI_CATEGORIES[selectedCategory].map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handlePresetSelect(emoji)}
                                            className={`aspect-square flex items-center justify-center text-3xl rounded-xl transition-all duration-200 hover:bg-muted hover:shadow-md hover:-translate-y-0.5 ${selectedValue === emoji
                                                ? 'bg-primary/10 ring-2 ring-primary shadow-inner scale-105'
                                                : 'bg-transparent'
                                                }`}
                                        >
                                            <span className="transform transition-transform active:scale-90">{emoji}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 text-center animate-in fade-in slide-in-from-left-4 duration-300">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group border-2 border-dashed border-border rounded-2xl p-10 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-300"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-3xl">📸</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                Click to upload
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                JPG, PNG or GIF (Max 100KB)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {isCompressing && (
                                    <div className="flex items-center justify-center space-x-2 text-primary">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm font-medium">Compressing & optimizing...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl flex items-center gap-2">
                                        <span>⚠️</span>
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-2 bg-gradient-to-t from-card via-card to-transparent z-10">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isCompressing || (selectedType === 'upload' && !uploadPreview)}
                        className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm md:text-base shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving Profile...
                            </>
                        ) : 'Save New Look'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
