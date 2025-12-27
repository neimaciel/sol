import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { 
    CreditCard, 
    DollarSign, 
    Upload, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    Building,
    QrCode,
    FileText
} from 'lucide-react'

interface Payment {
    id: string
    amount: number
    currency: string
    status: string
    method: string
    gateway_provider?: string
    created_at: string
    processed_at?: string
    manual_confirmed_by?: string
    manual_confirmed_at?: string
    manual_confirmation_notes?: string
    receipt_url?: string
    bank_data?: {
        bank_name?: string
        bank_agency?: string
        bank_account?: string
        bank_account_type?: string
        pix_key?: string
        pix_key_type?: string
    }
}

interface PaymentMethod {
    id: string
    name: string
    type: string
    gateway_provider?: string
    requires_bank_data: boolean
    supports_instant: boolean
    processing_time: string
}

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    loadId: string
    driverId: string
    amount: number
    existingPayment?: Payment
}

export function PaymentModal({ isOpen, onClose, loadId, driverId, amount, existingPayment }: PaymentModalProps) {
    const [payment, setPayment] = useState<Payment | null>(existingPayment || null)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [selectedMethod, setSelectedMethod] = useState<string>('manual-pix')
    const [loading, setLoading] = useState(false)
    const [confirmationNotes, setConfirmationNotes] = useState('')
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchPaymentMethods()
            if (existingPayment) {
                setPayment(existingPayment)
            } else {
                fetchPayment()
            }
        }
    }, [isOpen, loadId, existingPayment])

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/v1/payments/methods')
            const data = await response.json()
            setPaymentMethods(data.methods || [])
        } catch (error) {
            console.error('Erro ao carregar métodos de pagamento:', error)
        }
    }

    const fetchPayment = async () => {
        try {
            const response = await fetch(`/api/v1/payments/load/${loadId}`)
            const data = await response.json()
            if (data.payment) {
                setPayment(data.payment)
            }
        } catch (error) {
            console.error('Erro ao carregar pagamento:', error)
        }
    }

    const createPayment = async () => {
        setLoading(true)
        try {
            const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)
            
            const response = await fetch('/api/v1/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    load_id: loadId,
                    driver_id: driverId,
                    amount,
                    payment_method: selectedMethodData?.type === 'GATEWAY' ? 'GATEWAY' : 'MANUAL',
                    gateway_provider: selectedMethodData?.gateway_provider
                })
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Pagamento criado com sucesso!')
                fetchPayment()
            } else {
                throw new Error(result.detail || 'Erro ao criar pagamento')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const confirmManualPayment = async () => {
        if (!payment) return
        
        setLoading(true)
        try {
            // Upload do comprovante se houver
            let receiptUrl = ''
            if (uploadedFile) {
                const formData = new FormData()
                formData.append('file', uploadedFile)

                const uploadResponse = await fetch(`/api/v1/payments/${payment.id}/upload-receipt`, {
                    method: 'POST',
                    body: formData
                })
                
                const uploadResult = await uploadResponse.json()
                if (uploadResult.success) {
                    receiptUrl = uploadResult.receipt_url
                }
            }

            // Confirmar pagamento
            const response = await fetch(`/api/v1/payments/${payment.id}/confirm-manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confirmed_by: 'admin', // TODO: usar ID do usuário logado
                    notes: confirmationNotes,
                    receipt_url: receiptUrl
                })
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Pagamento confirmado!')
                fetchPayment()
            } else {
                throw new Error(result.detail || 'Erro ao confirmar pagamento')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
            PROCESSING: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processando' },
            COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completo' },
            MANUAL_CONFIRMED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmado' },
            FAILED: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Falhou' }
        }

        const config = statusConfig[status as keyof typeof statusConfig]
        const Icon = config?.icon || AlertCircle

        return (
            <Badge className={`${config?.color || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config?.label || status}
            </Badge>
        )
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Gerenciar Pagamento - {formatCurrency(amount)}
                    </DialogTitle>
                </DialogHeader>

                {!payment ? (
                    /* Criar Novo Pagamento */
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Criar Pagamento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Método de Pagamento</Label>
                                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map(method => (
                                                <SelectItem key={method.id} value={method.id}>
                                                    <div className="flex items-center gap-2">
                                                        {method.type === 'GATEWAY' ? <CreditCard className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                                        <span>{method.name}</span>
                                                        {method.supports_instant && <Badge variant="outline" className="text-xs">Instantâneo</Badge>}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button onClick={createPayment} disabled={loading} className="w-full">
                                    {loading ? 'Criando...' : 'Criar Pagamento'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* Gerenciar Pagamento Existente */
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Detalhes</TabsTrigger>
                            <TabsTrigger value="confirm" disabled={payment.status !== 'PENDING' || payment.method !== 'MANUAL'}>
                                Confirmar
                            </TabsTrigger>
                            <TabsTrigger value="history">Histórico</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        Status do Pagamento
                                        {getStatusBadge(payment.status)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Valor</Label>
                                            <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Método</Label>
                                            <p className="flex items-center gap-2">
                                                {payment.method === 'MANUAL' ? <Building className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                                {payment.method}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Criado em</Label>
                                            <p>{new Date(payment.created_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                        {payment.processed_at && (
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Processado em</Label>
                                                <p>{new Date(payment.processed_at).toLocaleString('pt-BR')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dados Bancários para Pagamento Manual */}
                                    {payment.method === 'MANUAL' && payment.bank_data && (
                                        <Card className="bg-muted/30">
                                            <CardHeader>
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Building className="w-4 h-4" />
                                                    Dados para Transferência
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                {payment.bank_data.pix_key && (
                                                    <div className="flex items-center gap-2 p-3 bg-card rounded border">
                                                        <QrCode className="w-5 h-5 text-green-600" />
                                                        <div>
                                                            <Label className="text-sm font-medium">Chave PIX ({payment.bank_data.pix_key_type})</Label>
                                                            <p className="font-mono text-sm">{payment.bank_data.pix_key}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {payment.bank_data.bank_name && (
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <Label>Banco</Label>
                                                            <p>{payment.bank_data.bank_name}</p>
                                                        </div>
                                                        <div>
                                                            <Label>Agência</Label>
                                                            <p>{payment.bank_data.bank_agency}</p>
                                                        </div>
                                                        <div>
                                                            <Label>Conta</Label>
                                                            <p>{payment.bank_data.bank_account}</p>
                                                        </div>
                                                        <div>
                                                            <Label>Tipo</Label>
                                                            <p>{payment.bank_data.bank_account_type}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="confirm" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Confirmar Pagamento Manual</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="notes">Observações</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Adicione observações sobre a confirmação..."
                                            value={confirmationNotes}
                                            onChange={(e) => setConfirmationNotes(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="receipt">Comprovante</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="receipt"
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                                            />
                                            {uploadedFile && (
                                                <Badge variant="outline">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    {uploadedFile.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={confirmManualPayment} 
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading ? 'Confirmando...' : 'Confirmar Pagamento'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Histórico</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 border rounded">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Pagamento criado</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(payment.created_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        {payment.manual_confirmed_at && (
                                            <div className="flex items-center gap-3 p-3 border rounded">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="text-sm font-medium">Confirmado manualmente</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(payment.manual_confirmed_at).toLocaleString('pt-BR')}
                                                        {payment.manual_confirmed_by && ` por ${payment.manual_confirmed_by}`}
                                                    </p>
                                                    {payment.manual_confirmation_notes && (
                                                        <p className="text-xs mt-1">{payment.manual_confirmation_notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {payment.receipt_url && (
                                            <div className="flex items-center gap-3 p-3 border rounded">
                                                <Upload className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium">Comprovante enviado</p>
                                                    <a 
                                                        href={payment.receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Ver comprovante
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}