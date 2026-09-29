const TimelineSkeleton = () => {
    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300">
            {/* Day Tab Bar Skeleton */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={`h-9 shrink-0 rounded-full skeleton-shimmer ${
                            i === 0 ? "w-24 bg-primary/20" : "w-20"
                        }`}
                    />
                ))}
            </div>

            {/* Quick Actions Bar Skeleton */}
            <div className="flex items-center justify-between px-1">
                <div className="h-6 w-32 rounded-md skeleton-shimmer" />
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                    <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
                </div>
            </div>

            {/* Timeline Stream Skeleton */}
            <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-6 md:-left-8 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer bg-primary/50" />
                        </div>

                        {/* Activity Card Skeleton */}
                        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md p-4 space-y-3 shadow-sm">
                            {/* Card Top: Time, Category, Title */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-12 rounded-md skeleton-shimmer" />
                                    <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                                    <div className="h-5 w-36 rounded-md skeleton-shimmer" />
                                </div>
                                <div className="h-6 w-16 rounded-md skeleton-shimmer" />
                            </div>

                            {/* Card Middle: Location & Notes */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full skeleton-shimmer shrink-0" />
                                    <div className="h-4 w-48 rounded skeleton-shimmer" />
                                </div>
                                <div className="h-3 w-3/4 rounded skeleton-shimmer opacity-70" />
                            </div>

                            {/* Card Footer: Metadata Pills */}
                            <div className="flex items-center gap-3 pt-1 border-t border-border/30">
                                <div className="h-4 w-20 rounded-full skeleton-shimmer" />
                                <div className="h-4 w-24 rounded-full skeleton-shimmer" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineSkeleton;
