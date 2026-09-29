const BookshelfSkeleton = () => {
    return (
        <div className="flex-1 px-4 md:px-8 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-300">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="w-full rounded-[1.75rem] border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm flex flex-col"
                >
                    {/* Cover Area */}
                    <div className="h-52 w-full skeleton-shimmer relative">
                        <div className="absolute top-4 left-4 h-6 w-20 rounded-full bg-black/20" />
                        <div className="absolute bottom-4 left-4 right-4 h-7 w-3/4 rounded-lg bg-black/20" />
                    </div>

                    {/* Meta Info Area */}
                    <div className="p-5 flex items-center justify-between border-t border-border/30">
                        <div className="space-y-1.5">
                            <div className="h-3 w-16 rounded skeleton-shimmer" />
                            <div className="h-4 w-32 rounded skeleton-shimmer" />
                        </div>
                        <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BookshelfSkeleton;
