export default function StatusFooter() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      <p className="font-mono text-xs md:text-sm text-[#6B7280] tracking-widest flex items-center gap-2">
        <span className="text-emerald-500 animate-pulse">●</span>
        HEADSET ACTIVE // READY FOR UPLINK
      </p>
    </div>
  );
}
