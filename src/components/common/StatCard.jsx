/**
 * StatCard component for dashboard insights - Luxury Dark Gold Theme
 * Spacious ("khula khula") with bright yellow metric count & high contrast text
 */
const StatCard = ({ title, count, icon: Icon, onClick, color = '#FFC629', subtitle, trend }) => {
  return (
    <div 
      className="flex min-w-0 cursor-pointer items-center gap-5 sm:gap-6 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#141414] p-6 sm:p-8 min-h-[145px] shadow-lg transition-all duration-200 hover:border-[#FFC629] hover:shadow-[0_8px_30px_rgba(255,198,41,0.15)] hover:-translate-y-0.5 group stat-card-container" 
      onClick={onClick}
    >
      <div 
        className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl text-2xl sm:text-3xl transition-transform duration-200 group-hover:scale-110 shadow-inner" 
        style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
      >
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-['Cinzel'] text-3xl sm:text-4xl font-extrabold leading-none text-[#FFC629] tracking-tight">
            {count}
          </h3>
          {trend && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${trend.isUp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        <p className="mt-2.5 text-xs font-bold uppercase tracking-wider text-white leading-relaxed break-words">
          {title}
        </p>
        {subtitle && (
          <span className="mt-1.5 block text-xs font-medium text-[#FFD770] leading-snug">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
