
import React from 'react';

const AnimatedPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-surface-light animate-pulse rounded-md ${className}`} />
);

const ArtistPageLoader: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-text font-sans">
            <div className="absolute top-0 left-0 w-full h-72 md:h-96 bg-surface opacity-20"></div>
            <main className="relative max-w-4xl mx-auto p-4 sm:p-6 z-10">
                {/* Back Button Placeholder */}
                <div className="absolute top-4 left-4 bg-surface/50 backdrop-blur-md rounded-full h-10 w-10"></div>
                
                {/* Header Placeholder */}
                <header className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-8 mt-16 md:mt-24">
                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-surface flex-shrink-0 border-4 border-background">
                        <AnimatedPlaceholder className="w-full h-full rounded-full" />
                    </div>
                    <div className="text-center md:text-left w-full md:w-auto">
                        <AnimatedPlaceholder className="h-10 sm:h-14 w-3/4 md:w-80 mx-auto md:mx-0 mb-4" />
                        <AnimatedPlaceholder className="h-5 w-1/2 md:w-64 mx-auto md:mx-0 mb-6" />
                        <AnimatedPlaceholder className="h-10 w-48 rounded-full mx-auto md:mx-0" />
                    </div>
                </header>
                
                {/* Albums Section Placeholder */}
                <div className="mt-12">
                    <AnimatedPlaceholder className="h-8 w-40 mb-4" />
                    <div className="flex gap-6 overflow-x-hidden pb-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-40 sm:w-48 flex-shrink-0">
                                <AnimatedPlaceholder className="aspect-square w-full rounded-2xl" />
                                <AnimatedPlaceholder className="h-5 w-3/4 mt-3" />
                                <AnimatedPlaceholder className="h-4 w-1/2 mt-2" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracks Section Placeholder */}
                <div className="mt-12">
                    <AnimatedPlaceholder className="h-8 w-56 mb-4" />
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center p-3 rounded-lg">
                                <div className="w-10 flex-shrink-0 mr-4">
                                    <AnimatedPlaceholder className="h-5 w-5 mx-auto" />
                                </div>
                                <AnimatedPlaceholder className="w-12 h-12 rounded-md flex-shrink-0" />
                                <div className="flex-grow mx-4">
                                    <AnimatedPlaceholder className="h-5 w-3/4 mb-2" />
                                    <AnimatedPlaceholder className="h-4 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ArtistPageLoader;