const PlaceListSkeleton = () => {
    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
            {/* Filter Pills Skeleton */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-8 shrink-0 rounded-full skeleton-shimmer ${
                            i === 0 ? "w-16 bg-primary/20" : "w-20"
                        }`}
                    />
                ))}
            </div>

            {/* Places Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm flex flex-col"
                    >
                        {/* Image Cover Skeleton */}
                        <div className="h-44 w-full skeleton-shimmer relative">
                            <div className="absolute top-3 right-3 h-6 w-16 rounded-full bg-black/20" />
                        </div>

                        {/* Card Content Skeleton */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="h-5 w-3/5 rounded-md skeleton-shimmer" />
                                    <div className="h-4 w-12 rounded-full skeleton-shimmer" />
                                </div>
                                <div className="h-3 w-2/5 rounded skeleton-shimmer opacity-70" />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/30">
                                <div className="flex items-center gap-2">
                                    <div className="h-3.5 w-3.5 rounded-full skeleton-shimmer shrink-0" />
                                    <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3.5 w-3.5 rounded-full skeleton-shimmer shrink-0" />
                                    <div className="h-3.5 w-1/2 rounded skeleton-shimmer" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaceListSkeleton;
