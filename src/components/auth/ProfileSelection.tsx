import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';
import { ProfileSetup } from './ProfileSetup';

export function ProfileSelection() {
    const { profiles, selectProfile } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    if (isCreating) {
        return <ProfileSetup />;
    }

    const handleSelect = async (profileId: string) => {
        setIsLoading(profileId);
        await selectProfile(profileId);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="w-full max-w-4xl space-y-12 animate-in fade-in zoom-in-95 duration-500">

                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                        Who's using Sanchez OS?
                    </h1>
                </div>

                <div className="flex flex-wrap justify-center gap-8">
                    {/* Existing Profiles */}
                    {profiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => handleSelect(profile.id)}
                            disabled={isLoading !== null}
                            className="group flex flex-col items-center gap-4 focus:outline-none"
                        >
                            <div className={`
                                w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-transparent 
                                group-hover:border-white group-focus:border-white transition-all duration-300 relative shadow-2xl
                                ${isLoading === profile.id ? 'opacity-50 scale-95' : 'group-hover:scale-105'}
                            `}>
                                <img
                                    src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                                    alt={profile.name}
                                    className="w-full h-full object-cover bg-slate-800"
                                />
                                {isLoading === profile.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <span className="text-xl text-slate-400 group-hover:text-white transition-colors font-medium">
                                {profile.name}
                            </span>
                        </button>
                    ))}

                    {/* Add Profile Button */}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="group flex flex-col items-center gap-4 focus:outline-none"
                    >
                        <div className="
                            w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-900 border-2 border-slate-800 
                            flex items-center justify-center group-hover:bg-slate-800 group-hover:border-slate-600 
                            transition-all duration-300 shadow-xl group-hover:scale-105
                        ">
                            <Plus className="w-12 h-12 text-slate-500 group-hover:text-slate-300" />
                        </div>
                        <span className="text-xl text-slate-400 group-hover:text-white transition-colors font-medium">
                            Add Profile
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
