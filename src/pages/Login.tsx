import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Truck, Loader2, Zap, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


export default function Login() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { signIn, signUp } = useAuthStore()
    const navigate = useNavigate()

    const isDev = import.meta.env.DEV

    useEffect(() => {
        if (isDev) {
            setEmail('test_brutal_123@example.com')
            setPassword('password123')
        }
    }, [isDev])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if (isLogin) {
            console.log('Starting login with:', email)
            try {
                const { error } = await signIn(email, password)
                console.log('Login result:', error)
                if (error) {
                    alert('Erro ao fazer login: ' + error.message)
                } else {
                    console.log('Login successful, navigating to /')
                    // Add delay to ensure state is updated
                    setTimeout(() => {
                        navigate('/')
                    }, 100)
                }
            } catch (err) {
                console.error('Login exception:', err)
                alert('Erro interno no login')
            } finally {
                setIsLoading(false)
            }
        } else {
            const { error } = await signUp(email, password, 'User')
            if (error) {
                alert('Erro ao criar conta: ' + error.message)
                setIsLoading(false)
            } else {
                alert('Conta criada com sucesso! Verifique seu email ou faça login.')
                setIsLogin(true)
                setIsLoading(false)
            }
        }
    }

    const handleQuickAccess = async () => {
        setIsLoading(true)
        const { error } = await signIn('test_brutal_123@example.com', 'password123')
        if (error) {
            // Fallback to signup if user doesn't exist in this env
            const { error: signUpError } = await signUp('test_brutal_123@example.com', 'password123', 'Test User')
            if (signUpError) {
                alert('Quick Access Failed: ' + signUpError.message)
                setIsLoading(false)
            } else {
                // Auto login after signup
                await signIn('test_brutal_123@example.com', 'password123')
                navigate('/')
            }
        } else {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen flex w-full bg-background font-sans">
            {/* Left Side - Branding (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12 border-r-4 border-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply"></div>

                <div className="relative z-10">
                    <div className="w-16 h-16 bg-background border-2 border-foreground shadow-brutal flex items-center justify-center mb-8">
                        <Truck className="w-8 h-8 text-foreground" strokeWidth={2} />
                    </div>
                    <h1 className="text-6xl font-heading font-black tracking-tighter leading-none mb-6">
                        SOL<br />TMS
                    </h1>
                    <p className="text-xl font-bold opacity-90 max-w-md border-l-4 border-background pl-6 py-2">
                        SISTEMA DE GESTÃO LOGÍSTICA<br />
                        <span className="font-mono text-sm opacity-75">V.2.0.0 // BRUTAL_EDITION</span>
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="bg-background text-foreground p-6 border-2 border-foreground shadow-brutal">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            AMBIENTE SEGURO
                        </h3>
                        <p className="text-sm font-mono text-muted-foreground">
                            Acesso restrito a pessoal autorizado. Todas as operações são monitoradas e registradas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/20 relative">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-4xl font-heading font-black text-foreground">SOL TMS</h1>
                        <p className="text-muted-foreground font-mono text-sm">GESTÃO LOGÍSTICA</p>
                    </div>

                    <div className="bg-background border-2 border-foreground shadow-brutal p-8 space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {isLogin ? 'ACESSAR SISTEMA' : 'NOVO CADASTRO'}
                            </h2>
                            <p className="text-sm text-muted-foreground font-mono">
                                {isLogin ? 'Entre com suas credenciais para continuar.' : 'Preencha os dados para solicitar acesso.'}
                            </p>
                        </div>

                        {isDev && (
                            <div className="bg-yellow-50 border-2 border-yellow-500 p-4 shadow-brutal-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 font-mono">DEV MODE</div>
                                <h3 className="font-bold text-yellow-900 flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 fill-yellow-500 text-yellow-700" /> Acesso Rápido
                                </h3>
                                <p className="text-xs text-yellow-800 mb-3 font-mono">Ambiente de desenvolvimento detectado.</p>
                                <Button
                                    onClick={handleQuickAccess}
                                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-2 border-yellow-900 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none font-bold"
                                >
                                    ⚡ Entrar como Admin
                                </Button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Corporativo</label>
                                    <Input
                                        type="email"
                                        placeholder="usuario@sol-log.com.br"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-12 bg-muted/30 border-2 border-border focus:border-primary focus:ring-0 rounded-none font-mono text-sm transition-colors"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha de Acesso</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 bg-muted/30 border-2 border-border focus:border-primary focus:ring-0 rounded-none font-mono text-sm transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 text-lg font-bold shadow-brutal bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-foreground rounded-none hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        PROCESSANDO...
                                    </>
                                ) : (
                                    isLogin ? 'ENTRAR NO SISTEMA' : 'CRIAR CONTA'
                                )}
                            </Button>

                            <div className="text-center pt-4 border-t-2 border-dashed border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-sm font-bold text-primary hover:text-primary/80 hover:underline decoration-2 underline-offset-4 uppercase tracking-wide"
                                >
                                    {isLogin ? 'Solicitar novo acesso' : 'Voltar para login'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <p className="text-center text-xs font-mono text-muted-foreground">
                        SOL TMS v2.0 // SYSTEM_READY
                    </p>
                </div>
            </div>
        </div>
    )
}
