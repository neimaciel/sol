import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const revenueData = [
    { name: 'Seg', value: 4000 },
    { name: 'Ter', value: 3000 },
    { name: 'Qua', value: 2000 },
    { name: 'Qui', value: 2780 },
    { name: 'Sex', value: 1890 },
    { name: 'Sáb', value: 2390 },
    { name: 'Dom', value: 3490 },
]

const tripsData = [
    { name: 'Sem 1', trips: 12 },
    { name: 'Sem 2', trips: 19 },
    { name: 'Sem 3', trips: 15 },
    { name: 'Sem 4', trips: 22 },
]

export function RevenueChart() {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" vertical={false} opacity={0.2} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                            borderRadius: '0px',
                            border: '2px solid hsl(var(--border))',
                            boxShadow: '4px 4px 0px hsl(var(--foreground))',
                            backgroundColor: 'hsl(var(--card))',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'hsl(var(--foreground))'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 900, fontSize: 11 }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 11 }}
                    />
                    <Bar
                        dataKey="value"
                        fill="hsl(var(--foreground))"
                        radius={[0, 0, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export function TripsChart() {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tripsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" vertical={false} opacity={0.2} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '0px',
                            border: '2px solid hsl(var(--border))',
                            boxShadow: '4px 4px 0px hsl(var(--foreground))',
                            backgroundColor: 'hsl(var(--card))',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'hsl(var(--foreground))'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 900, fontSize: 11 }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: 11 }}
                    />
                    <Line
                        type="linear"
                        dataKey="trips"
                        stroke="hsl(var(--foreground))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--foreground))', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--foreground))' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

const funnelData = [
    { value: 100, label: 'Ofertas', color: 'bg-foreground', subtext: '100% inicial' },
    { value: 80, label: 'Negociações', color: 'bg-foreground/80', subtext: '80% conv.' },
    { value: 50, label: 'Viagens', color: 'bg-foreground/60', subtext: '62% conv.' },
    { value: 40, label: 'Concluídas', color: 'bg-foreground/40', subtext: '80% sucesso' },
]

export function FunnelChart() {
    return (
        <div className="h-[200px] w-full flex flex-col justify-center">
            <div className="relative w-full h-[120px] flex items-center">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2" />

                {/* Funnel Steps */}
                <div className="w-full flex justify-between items-center relative z-10 px-4">
                    {funnelData.map((step, index) => (
                        <div key={step.label} className="flex flex-col items-center group relative">
                            {/* Connector Line (except for first item) */}
                            {index > 0 && (
                                <div
                                    className="absolute top-1/2 -left-[50%] w-full h-1 -translate-y-1/2 -z-10 bg-gradient-to-r from-transparent to-transparent"
                                />
                            )}

                            {/* Square Node */}
                            <div
                                className={`w-12 h-12 flex items-center justify-center shadow-brutal dark:shadow-brutal-dark transition-transform duration-300 group-hover:scale-110 border-2 border-border ${step.color}`}
                            >
                                <span className="text-background font-black text-sm">{step.value}</span>
                            </div>

                            {/* Labels */}
                            <div className="absolute -bottom-10 flex flex-col items-center whitespace-nowrap">
                                <span className="text-xs font-black text-foreground uppercase">{step.label}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">{step.subtext}</span>
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] py-1 px-2 pointer-events-none whitespace-nowrap font-bold uppercase border-2 border-background shadow-brutal-sm">
                                {step.value} {step.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
