"use client"

export default function FindingElectivesLoading() {
    return (
        <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-black/10 shadow-sm w-full max-w-145 px-10 py-12 flex flex-col items-center gap-6">

                {/* Spinning icon */}
                <div className="relative w-16 h-16">
                    {/* Spinning arc */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 64 64"
                        fill="none"
                        style={{ animation: "spin 1.2s linear infinite" }}
                    >
                        <circle
                            cx="32" cy="32" r="28"
                            stroke="#d0e4f7"
                            strokeWidth="3"
                        />
                        <path
                            d="M 32 4 A 28 28 0 0 1 60 32"
                            stroke="#0075de"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Center icon background */}
                    <div className="absolute inset-1.5 rounded-full bg-[#eaf4ff] flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0075de" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </div>
                </div>

                {/* Title & subtitle */}
                <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-bold text-black/90">Finding your best electives</h2>
                </div>

                {/* Skeleton cards */}
                <div className="w-full flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="w-full h-17.5 rounded-xl bg-[#f0f0f0]"
                            style={{
                                animation: "skeletonPulse 1.6s ease-in-out infinite",
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Bouncing dots */}
                <div className="flex items-center gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                        <span
                            key={i}
                            className="w-1.75 h-1.75 rounded-full bg-[#0075de]"
                            style={{
                                animation: "dotBounce 1.2s ease-in-out infinite",
                                animationDelay: `${delay}s`,
                            }}
                        />
                    ))}
                </div>

            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes skeletonPulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes dotBounce {
                    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-4px); }
                }
            `}</style>
        </div>
    )
}
