import { useParams } from 'react-router-dom'
import { api } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Truck, Calendar, ArrowRight, MessageCircle, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function PublicLoadView() {
  const { loadId } = useParams<{ loadId: string }>()
  const [isInterested, setIsInterested] = useState(false)
  const [driverData, setDriverData] = useState({ name: '', phone: '', experience: '' })
  const [load, setLoad] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLoad = async () => {
      if (!loadId) return
      
      try {
        setLoading(true)
        const data = await api.getLoad(loadId)
        setLoad(data)
      } catch (error) {
        console.error('Erro ao carregar dados da carga:', error)
        setError('Não foi possível carregar os dados da carga')
      } finally {
        setLoading(false)
      }
    }

    fetchLoad()
  }, [loadId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da carga...</p>
        </div>
      </div>
    )
  }

  if (error || !load) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Carga não encontrada</h1>
          <p className="text-gray-600">{error || 'Esta carga pode ter sido removida ou o link está incorreto.'}</p>
        </div>
      </div>
    )
  }


  const handleInterest = () => {
    if (!driverData.name || !driverData.phone) {
      alert('Por favor, preencha seu nome e telefone.')
      return
    }
    setIsInterested(true)
    // Em produção, aqui salvaria no Supabase
    console.log('Motorista interessado:', driverData)
  }

  const handleWhatsApp = () => {
    const origin = `${load.origin_city}/${load.origin_state}`
    const destination = `${load.destination_city}/${load.destination_state}`
    const value = `R$ ${load.price?.toLocaleString('pt-BR')}`
    const message = `Olá! Tenho interesse na carga ${origin} → ${destination} (${value}). Meu nome é ${driverData.name}, telefone: ${driverData.phone}`
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (isInterested) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Interesse Registrado!</h1>
          <p className="text-gray-600 mb-6">
            Seu interesse foi registrado com sucesso. A transportadora entrará em contato em breve.
          </p>
          <Button onClick={handleWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
            <MessageCircle className="w-4 h-4 mr-2" />
            Falar no WhatsApp
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">SOL Logistics</h1>
              <p className="text-gray-600 text-sm">Portal do Motorista</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Oportunidade de Frete
            </Badge>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Informações da Carga */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-blue-600 text-white">CARGA-{load.id.substring(0, 4)}</Badge>
            <Badge variant="secondary">Carga Completa</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Origem */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-600">ORIGEM</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{load.origin}</p>
              <p className="text-sm text-gray-600">Av. Principal, 1000</p>
            </div>

            {/* Destino */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-600">DESTINO</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{load.destination}</p>
              <p className="text-sm text-gray-600">Av. Central, 500</p>
            </div>
          </div>

          {/* Rota Visual */}
          <div className="flex items-center justify-center mb-6 py-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-gray-700">{load.origin}</span>
            <ArrowRight className="w-6 h-6 mx-4 text-blue-600" />
            <span className="font-bold text-gray-700">{load.destination}</span>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Valor do Frete</p>
              <p className="font-bold text-green-600">R$ {load.value}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Veículo</p>
              <p className="font-bold text-blue-600">{load.vehicle_type}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Coleta</p>
              <p className="font-bold text-purple-600">{load.date}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <span className="block w-6 h-6 bg-orange-600 rounded-full mx-auto mb-1"></span>
              <p className="text-sm text-gray-600">Peso</p>
              <p className="font-bold text-orange-600">12.6 ton</p>
            </div>
          </div>
        </div>

        {/* Formulário de Interesse */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Demonstrar Interesse</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Seu Nome Completo
              </label>
              <input
                type="text"
                value={driverData.name}
                onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Digite seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Telefone/WhatsApp
              </label>
              <input
                type="tel"
                value={driverData.phone}
                onChange={(e) => setDriverData({ ...driverData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Experiência (opcional)
            </label>
            <textarea
              value={driverData.experience}
              onChange={(e) => setDriverData({ ...driverData, experience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              rows={3}
              placeholder="Ex: 5 anos transportando cargas, veículo próprio, etc."
            />
          </div>

          <Button 
            onClick={handleInterest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Demonstrar Interesse Nesta Carga
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Ao demonstrar interesse, seus dados serão enviados para a transportadora.
          </p>
        </div>
      </div>
    </div>
  )
}