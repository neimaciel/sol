import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { MapPin, Truck, Package, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

interface Load {
    id: string
    origin: string
    destination: string
    value: string
    vehicle_type?: string
    // Add other fields as needed based on DB schema
}

export default function DriverPortal() {
    const { id } = useParams<{ id: string }>()
    const [load, setLoad] = useState<Load | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [systemPhone, setSystemPhone] = useState(import.meta.env.VITE_SYSTEM_PHONE || '5541999999999')

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        vehicle_type: '',
        vehicle_plate: ''
    })

    useEffect(() => {
        async function fetchLoad() {
            if (!id) return

            try {
                const { data, error } = await supabase
                    .from('loads')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setLoad(data)
            } catch (err) {
                console.error('Error fetching load:', err)
                setError('Carga não encontrada ou indisponível.')
            } finally {
                setLoading(false)
            }
        }

        fetchLoad()
        fetchLoad()
    }, [id])

    // Fetch system phone
    useEffect(() => {
        const fetchSystemPhone = async () => {
            try {
                const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
                const response = await fetch(`${apiUrl}/api/v1/whatsapp/system-phone`)
                const data = await response.json()
                if (data.phone) {
                    setSystemPhone(data.phone)
                }
            } catch (error) {
                console.error('Error fetching system phone:', error)
            }
        }
        fetchSystemPhone()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

            const response = await fetch(`${apiUrl}/api/v1/candidates/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    load_id: id,
                    driver: formData
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Erro ao enviar candidatura.')
            }

            setSuccess(true)
        } catch (err) {
            console.error('Error applying:', err)
            setError(err instanceof Error ? err.message : 'Erro ao enviar candidatura.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Auto-fill phone from URL query parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const phoneParam = params.get('phone')
        if (phoneParam) {
            // Clean and format phone number
            const cleanPhone = phoneParam.replace(/\D/g, '') // Remove non-digits
            setFormData(prev => ({ ...prev, phone: cleanPhone }))
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!load) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="bg-white border-2 border-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Carga não encontrada</h1>
                    <p className="text-zinc-600">{error || 'Verifique o link e tente novamente.'}</p>
                </div>
            </div>
        )
    }

    if (success) {
        // systemPhone is already set from state (env var or API)
        const message = `Tenho interesse na carga ${load.id}. Meu nome é ${formData.name}. Placa: ${formData.vehicle_plate}.`
        const whatsappUrl = `https://wa.me/${systemPhone}?text=${encodeURIComponent(message)}`

        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border-2 border-emerald-500 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)] p-8 max-w-md w-full text-center"
                >
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-zinc-900 mb-4">Candidatura Enviada!</h1>
                    <p className="text-zinc-600 mb-8">
                        Finalize seu cadastro enviando a mensagem para nosso sistema no WhatsApp.
                    </p>

                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all rounded-none mb-4"
                    >
                        ABRIR WHATSAPP AGORA
                    </a>

                    <p className="text-xs text-zinc-400">
                        Caso não abra automaticamente, clique no botão acima.
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-12">
            {/* Header */}
            <header className="bg-zinc-900 text-white py-6 px-4 mb-8 border-b-4 border-emerald-500">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-zinc-900">S</div>
                        <span className="font-bold text-xl tracking-tight">SOL LOGISTICS</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Load Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white border-2 border-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-6">
                            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-600" />
                                Detalhes da Carga
                            </h2>

                            <div className="space-y-6 relative">
                                {/* Route Line */}
                                <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-zinc-200 -z-10"></div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center shrink-0 z-10">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Origem</label>
                                        <p className="text-lg font-bold text-zinc-900">{load.origin}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-zinc-400 flex items-center justify-center shrink-0 z-10">
                                        <MapPin className="w-3 h-3 text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Destino</label>
                                        <p className="text-lg font-bold text-zinc-900">{load.destination}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t-2 border-zinc-100 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                        <DollarSign className="w-3 h-3" /> Valor
                                    </label>
                                    <p className="text-xl font-bold text-emerald-600">{load.value}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                        <Truck className="w-3 h-3" /> Veículo
                                    </label>
                                    <p className="text-lg font-bold text-zinc-900">{load.vehicle_type || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Application Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="bg-white border-2 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
                            <h2 className="text-xl font-bold text-zinc-900 mb-2">Quero essa carga!</h2>
                            <p className="text-zinc-500 text-sm mb-6">Preencha seus dados para se candidatar.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-zinc-200 p-4 font-bold text-lg text-zinc-900 focus:outline-none focus:border-emerald-500 rounded-none placeholder:text-zinc-300"
                                        placeholder="Seu nome"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                                        WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        placeholder="(00) 00000-0000"
                                        className="w-full bg-white border-2 border-zinc-200 p-4 font-bold text-lg text-zinc-900 focus:outline-none focus:border-emerald-500 rounded-none placeholder:text-zinc-300"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                                            Veículo
                                        </label>
                                        <select
                                            name="vehicle_type"
                                            required
                                            value={formData.vehicle_type}
                                            onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                            className="w-full bg-white border-2 border-zinc-200 p-4 font-bold text-lg text-zinc-900 focus:outline-none focus:border-emerald-500 rounded-none appearance-none"
                                        >
                                            <option value="">Selecione</option>
                                            <option value="Carreta">Carreta</option>
                                            <option value="Truck">Truck</option>
                                            <option value="Bitruck">Bitruck</option>
                                            <option value="VUC">VUC</option>
                                            <option value="Toco">Toco</option>
                                            <option value="3/4">3/4</option>
                                            <option value="Fiorino">Fiorino</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">Placa</label>
                                        <input
                                            type="text"
                                            name="vehicle_plate"
                                            value={formData.vehicle_plate}
                                            onChange={handleChange}
                                            className="w-full bg-white border-2 border-zinc-200 p-4 font-bold text-lg text-zinc-900 focus:outline-none focus:border-emerald-500 rounded-none placeholder:text-zinc-300"
                                            placeholder="ABC-1234"
                                        />
                                    </div>
                                </div>



                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    {submitting ? 'ENVIANDO...' : 'ENVIAR CANDIDATURA'}
                                </button>
                            </form>
                        </div>
                    </motion.div >
                </div >
            </main >
        </div >
    )
}
