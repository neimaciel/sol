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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(107, 140, 174, 0.05)' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 12px rgba(107, 140, 174, 0.15)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            fontSize: 11
                        }}
                        labelStyle={{ color: '#374151', fontWeight: 600, fontSize: 11 }}
                        itemStyle={{ color: '#6B8CAE', fontWeight: 500, fontSize: 11 }}
                    />
                    <Bar
                        dataKey="value"
                        fill="url(#blueGradient)"
                        radius={[6, 6, 0, 0]}
                    />
                    <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6B8CAE" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.7} />
                        </linearGradient>
                    </defs>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 4px 12px rgba(107, 140, 174, 0.15)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            fontSize: 11
                        }}
                        labelStyle={{ color: '#374151', fontWeight: 600, fontSize: 11 }}
                        itemStyle={{ color: '#6B8CAE', fontWeight: 500, fontSize: 11 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="trips"
                        stroke="#6B8CAE"
                        strokeWidth={2.5}
                        dot={{ fill: '#6B8CAE', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

const funnelData = [
    { value: 100, label: 'Ofertas', color: '#6B8CAE', subtext: '100% inicial' },
    { value: 80, label: 'Negociações', color: '#8B5CF6', subtext: '80% conv.' },
    { value: 50, label: 'Viagens', color: '#10B981', subtext: '62% conv.' },
    { value: 40, label: 'Concluídas', color: '#F59E0B', subtext: '80% sucesso' },
]

export function FunnelChart() {
    return (
        <div className="h-[200px] w-full flex flex-col justify-center">
            <div className="relative w-full h-[120px] flex items-center">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />

                {/* Funnel Steps */}
                <div className="w-full flex justify-between items-center relative z-10 px-4">
                    {funnelData.map((step, index) => (
                        <div key={step.label} className="flex flex-col items-center group relative">
                            {/* Connector Line (except for first item) */}
                            {index > 0 && (
                                <div
                                    className="absolute top-1/2 -left-[50%] w-full h-1 -translate-y-1/2 -z-10"
                                    style={{
                                        background: `linear-gradient(to right, ${funnelData[index - 1].color}40, ${step.color}40)`
                                    }}
                                />
                            )}

                            {/* Circle Node */}
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 border-2 border-white"
                                style={{
                                    backgroundColor: step.color,
                                    boxShadow: `0 4px 12px ${step.color}40`
                                }}
                            >
                                <span className="text-white font-bold text-sm">{step.value}</span>
                            </div>

                            {/* Labels */}
                            <div className="absolute -bottom-10 flex flex-col items-center whitespace-nowrap">
                                <span className="text-xs font-bold text-gray-700">{step.label}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{step.subtext}</span>
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap">
                                {step.value} {step.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
