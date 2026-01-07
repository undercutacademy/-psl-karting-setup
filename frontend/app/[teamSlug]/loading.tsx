
export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
            {/* Racing stripes background */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-1 h-full bg-gray-600 transform -skew-x-12 animate-pulse"></div>
                <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-gray-600 transform -skew-x-12 animate-pulse"></div>
                <div className="absolute top-0 right-1/4 w-1 h-full bg-gray-600 transform -skew-x-12 animate-pulse"></div>
                <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-gray-600 transform -skew-x-12 animate-pulse"></div>
            </div>

            <div className="relative z-10 w-full max-w-2xl animate-pulse">
                {/* Logo Skeleton */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-[350px] h-[140px] bg-gray-800/50 rounded-xl mb-4"></div>
                    <div className="h-8 w-64 bg-gray-800/50 rounded mb-2"></div>
                    <div className="h-5 w-48 bg-gray-800/50 rounded"></div>
                </div>

                {/* Cards Container Skeleton */}
                <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Left Card Skeleton */}
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-800 bg-gray-800/20 p-8 h-[250px]">
                            <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                            <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
                            <div className="h-4 w-40 bg-gray-800 rounded"></div>
                        </div>

                        {/* Right Card Skeleton */}
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-800 bg-gray-800/20 p-8 h-[250px]">
                            <div className="w-16 h-16 bg-gray-800 rounded-full mb-4"></div>
                            <div className="h-6 w-40 bg-gray-800 rounded mb-2"></div>
                            <div className="h-4 w-48 bg-gray-800 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Loading Text Indicator */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm animate-pulse">Starting engines... (Server waking up)</p>
                </div>
            </div>
        </div>
    );
}
