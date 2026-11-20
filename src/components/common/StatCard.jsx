/**
 * StatCard component for dashboard insights - Luxury Dark Gold Theme
 * Spacious ("khula khula") with bright yellow metric count & high contrast text
 */
const StatCard = ({ title, count, icon: Icon, onClick, color = '#FFC629', subtitle, trend }) => {
  return (
    <div 
      className="flex min-w-0 cursor-pointer items-center gap-3.5 sm:gap-4 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#141414] p-4 sm:p-5 lg:p-6 min-h-[135px] shadow-lg transition-all duration-200 hover:border-[#FFC629] hover:shadow-[0_8px_30px_rgba(255,198,41,0.15)] hover:-translate-y-0.5 group stat-card-container" 
      onClick={onClick}
    >
      <div 
        className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl text-xl sm:text-2xl transition-transform duration-200 group-hover:scale-110 shadow-inner" 
        style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
      >
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-['Cinzel'] text-2xl sm:text-3xl font-extrabold leading-none text-[#FFC629] tracking-tight">
            {count}
          </h3>
          {trend && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${trend.isUp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-white leading-snug whitespace-nowrap">
          {title}
        </p>
        {subtitle && (
          <span className="mt-1 block text-xs font-medium text-[#FFD770] leading-snug whitespace-nowrap">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
