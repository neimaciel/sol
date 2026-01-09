import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Truck, Users, Package, TrendingUp } from 'lucide-react'

export default function SimpleDashboard() {
    const { user, signOut } = useAuthStore()
    
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">🔄 Carregando usuário...</h1>
                    <p className="text-muted-foreground">Aguarde um momento</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">SOL TMS</h1>
                        <p className="text-sm text-muted-foreground">Sistema de Gestão Logística</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="outline" onClick={signOut}>
                            Sair
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Welcome */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Bem-vindo, {user.name}! 👋
                        </h2>
                        <p className="text-muted-foreground">
                            Sistema funcionando corretamente. Dashboard completo em desenvolvimento.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Cargas</p>
                                    <p className="text-2xl font-bold text-foreground">23</p>
                                </div>
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Motoristas</p>
                                    <p className="text-2xl font-bold text-foreground">12</p>
                                </div>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Veículos</p>
                                    <p className="text-2xl font-bold text-foreground">8</p>
                                </div>
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <Truck className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Receita</p>
                                    <p className="text-2xl font-bold text-foreground">R$ 45.2k</p>
                                </div>
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button className="h-20 flex flex-col items-center gap-2">
                                <Package className="w-6 h-6" />
                                Nova Carga
                            </Button>
                            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                                <Users className="w-6 h-6" />
                                Gerenciar Motoristas
                            </Button>
                            <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                                <TrendingUp className="w-6 h-6" />
                                Relatórios
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}