import { DollarSign, Truck, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react'

const stats = [
    {
        title: 'Faturamento',
        value: 'R$ 45.2k',
        change: '+20.1%',
        trend: 'up',
        icon: DollarSign,
        color: '#10B981',
    },
    {
        title: 'Viagens',
        value: '12',
        change: '+4',
        trend: 'up',
        icon: Truck,
        color: '#6B8CAE',
    },
    {
        title: 'Motoristas',
        value: '24',
        change: '-2',
        trend: 'down',
        icon: Users,
        color: '#8B5CF6',
    },
    {
        title: 'Taxa Entrega',
        value: '98.5%',
        change: '+1.2%',
        trend: 'up',
        icon: Activity,
        color: '#F59E0B',
    },
]

export function StatsCards() {
    return (
        <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <div key={stat.title} className="bg-card border-2 border-border shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group">
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-wide">
                                {stat.title}
                            </p>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 flex items-center justify-center" style={{ backgroundColor: `${stat.color}15`, borderColor: `${stat.color}30` }}>
                                <stat.icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: stat.color }} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Value */}
                        <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">{stat.value}</h3>

                        {/* Change */}
                        <div className="flex items-center gap-1 sm:gap-1.5">
                            {stat.trend === 'up' ? (
                                <>
                                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" strokeWidth={3} />
                                    <span className="text-[10px] sm:text-xs font-black text-emerald-600">{stat.change}</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" strokeWidth={3} />
                                    <span className="text-[10px] sm:text-xs font-black text-red-600">{stat.change}</span>
                                </>
                            )}
                            <span className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase hidden sm:inline">vs mês</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
