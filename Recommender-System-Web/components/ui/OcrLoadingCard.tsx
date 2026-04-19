"use client"

export default function OcrLoadingCard() {
    return (
        <div className="min-h-screen bg-[#f6f5f4] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-black/10 shadow-sm w-full max-w-130 px-10 py-16 flex flex-col items-center gap-5">

                {/* Animated Document Illustration */}
                <div className="relative w-36 h-44 flex items-center justify-center">
                    {/* Front paper only */}
                    <div className="relative w-36 h-44 bg-white border border-[#d0e4f7] rounded-md shadow-sm overflow-hidden flex flex-col justify-start px-4 pt-5 pb-4 gap-2.5">

                        {/* Shimmer lines */}
                        {[75, 60, 70, 50, 65, 55, 45].map((w, i) => (
                            <div
                                key={i}
                                className="h-1.75 bg-[#c5dff5] rounded-full"
                                style={{
                                    width: `${w}%`,
                                    animation: "shimmer 1.6s ease-in-out infinite",
                                    animationDelay: `${i * 0.12}s`,
                                }}
                            />
                        ))}

                        {/* Laser scan bar — runs top to bottom to top */}
                        <div
                            className="absolute left-0 right-0 h-0.5"
                            style={{
                                background: "linear-gradient(#38aeff 50%, #0075de 60%, transparent 100%)",
                                boxShadow: "0 0 6px 2px rgba(0, 117, 222, 0.4)",
                                animation: "laserScan 1.8s ease-in-out infinite",
                            }}
                        />
                    </div>
                </div>

                {/* Status row */}
                <div className="flex items-center gap-2.5">
                    {/* Spinner */}
                    <div
                        className="w-4.5 h-4.5 rounded-full border-2 border-[#d0e4f7] border-t-[#0075de]"
                        style={{ animation: "spin 0.8s linear infinite" }}
                    />

                    {/* Text */}
                    <span className="text-[#0075de] font-semibold text-[15px]">
                        Reading transcript
                    </span>

                    {/* Dots */}
                    <div className="flex items-center gap-1 ml-0.5">
                        {[0, 0.1, 0.2].map((delay, i) => (
                            <span
                                key={i}
                                className="w-1.25 h-1.25 rounded-full bg-[#0075de]"
                                style={{
                                    animation: "dotBounce 1.2s ease-in-out infinite",
                                    animationDelay: `${delay}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Subtitle */}
                <p className="text-sm text-[#a39e98]">Please don't close this window</p>
            </div>

            {/* Keyframes */}
            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes dotBounce {
                    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-3px); }
                }
                @keyframes laserScan {
                    0%   { top: 0%; }
                    50%  { top: calc(100% - 2px); }
                    100% { top: 0%; }
                }
            `}</style>
        </div>
    )
}