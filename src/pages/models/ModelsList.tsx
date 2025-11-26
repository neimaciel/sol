import { useEffect, useState } from 'react'
import { useModelsStore } from '@/store/useModelsStore'
import { useContractTemplatesStore, type ContractTemplate } from '@/store/useContractTemplatesStore'
import { ModelFormModal } from './ModelFormModal'
import { ContractTemplateFormModal } from './ContractTemplateFormModal'
import { useProductTemplatesStore, type ProductTemplate } from '@/store/useProductTemplatesStore'
import { ProductTemplateFormModal } from './ProductTemplateFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Filter, ArrowLeft, Trash2, Copy, Package, Truck, Snowflake, Edit2, FileText, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'loads' | 'products' | 'contracts'

export default function ModelsList() {
    const navigate = useNavigate()

    // Load Models State
    const { models, fetchModels, deleteModel, isLoading: isLoadingModels } = useModelsStore()

    // Contract Templates State
    const { templates, fetchTemplates, deleteTemplate, isLoading: isLoadingTemplates } = useContractTemplatesStore()

    // Product Templates State
    const { templates: productTemplates, fetchTemplates: fetchProductTemplates, deleteTemplate: deleteProductTemplate, isLoading: isLoadingProductTemplates } = useProductTemplatesStore()

    const [activeTab, setActiveTab] = useState<TabType>('loads')
    const [searchTerm, setSearchTerm] = useState('')

    // Modals State
    const [isModelModalOpen, setIsModelModalOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState<any>(null)

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [selectedProductTemplate, setSelectedProductTemplate] = useState<ProductTemplate | null>(null)

    useEffect(() => {
        if (activeTab === 'loads') {
            fetchModels()
        } else if (activeTab === 'contracts') {
            fetchTemplates()
        } else if (activeTab === 'products') {
            fetchProductTemplates()
        }
    }, [activeTab, fetchModels, fetchTemplates, fetchProductTemplates])

    // Handlers for Load Models
    const handleDeleteModel = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este modelo?')) {
            await deleteModel(id)
        }
    }

    const handleEditModel = (model: any) => {
        setSelectedModel(model)
        setIsModelModalOpen(true)
    }

    const handleCreateModel = () => {
        setSelectedModel(null)
        setIsModelModalOpen(true)
    }

    const handleUseModel = (model: any) => {
        localStorage.setItem('selectedLoadModel', JSON.stringify({
            title: model.name,
            origin: model.origin,
            destination: model.destination,
            type: model.type,
            vehicle_type: model.vehicleType
        }))
        navigate('/')
    }

    // Handlers for Contract Templates
    const handleDeleteTemplate = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este modelo de contrato?')) {
            await deleteTemplate(id)
        }
    }

    const handleEditTemplate = (template: ContractTemplate) => {
        setSelectedTemplate(template)
        setIsTemplateModalOpen(true)
    }

    const handleCreateTemplate = () => {
        setSelectedTemplate(null)
        setIsTemplateModalOpen(true)
    }

    // Handlers for Product Templates
    const handleDeleteProductTemplate = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este modelo de produto?')) {
            await deleteProductTemplate(id)
        }
    }

    const handleEditProductTemplate = (template: ProductTemplate) => {
        setSelectedProductTemplate(template)
        setIsProductModalOpen(true)
    }

    const handleCreateProductTemplate = () => {
        setSelectedProductTemplate(null)
        setIsProductModalOpen(true)
    }

    // Filtering
    const filteredModels = models.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const filteredProductTemplates = productTemplates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const getIcon = (type: string) => {
        switch (type) {
            case 'Refrigerada': return <Snowflake className="w-4 h-4" />
            case 'Fracionada': return <Package className="w-4 h-4" />
            default: return <Truck className="w-4 h-4" />
        }
    }

    const isLoading = activeTab === 'contracts' ? isLoadingTemplates : (activeTab === 'products' ? isLoadingProductTemplates : isLoadingModels)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-screen flex flex-col bg-background"
        >
            {/* Header */}
            <header className="m-8 mb-0 shrink-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/')}
                            className="glass-card hover:bg-white/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Layers className="w-6 h-6" />
                                </div>
                                {activeTab === 'contracts' ? 'Modelos de Contrato' : 'Modelos de Carga'}
                            </h1>
                            <p className="text-sm text-muted-foreground font-medium mt-1 ml-1">
                                {activeTab === 'contracts'
                                    ? 'Templates para geração de contratos'
                                    : (activeTab === 'products' ? 'Templates de requisitos por produto' : 'Templates para agilizar o cadastro de cargas')}
                            </p>
                        </div>
                    </div>

                    <Button
                        className="bg-primary hover:bg-primary-600 text-white rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 font-medium px-6 gap-2"
                        onClick={activeTab === 'contracts' ? handleCreateTemplate : (activeTab === 'products' ? handleCreateProductTemplate : handleCreateModel)}
                    >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Novo Modelo
                    </Button>
                </div>

                <div className="glass-card p-1 rounded-2xl border-white/40 shadow-xl shadow-blue-900/5 flex flex-col gap-4">
                    {/* Tabs */}
                    <div className="flex p-1 gap-1 bg-secondary/50 rounded-xl">
                        {[
                            { id: 'loads', label: 'Modelos de Cargas' },
                            { id: 'products', label: 'Modelos por Produto' },
                            { id: 'contracts', label: 'Modelos de Contratos' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`
                                    flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative
                                    ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/50'}
                                `}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white shadow-sm rounded-lg border border-gray-100"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-4 px-4 pb-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                className="input-soft pl-11 h-12 border-gray-200/50 bg-white/50 focus:bg-white/80 transition-all"
                                placeholder="Buscar modelos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="glass-card hover:bg-white/60 h-12 w-12">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {/* Load Models List */}
                            {activeTab === 'loads' && filteredModels.map((model, index) => (
                                <motion.div
                                    key={model.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative rounded-2xl border-white/40"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleEditModel(model)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteModel(model.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-lg font-heading font-bold text-foreground mb-2 pr-8">{model.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                                            {model.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="px-2.5 py-1 rounded-md bg-secondary text-xs font-bold text-muted-foreground flex items-center gap-1.5 border border-border/50">
                                            {getIcon(model.type)}
                                            {model.vehicleType}
                                        </span>
                                        <span className="text-xs text-muted-foreground/40">•</span>
                                        <span className="text-xs text-muted-foreground">Criado em {model.createdAt}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Usado {model.usageCount} vezes
                                        </span>
                                        <Button
                                            className="bg-primary/10 hover:bg-primary/20 text-primary gap-2 h-8 text-xs font-bold border border-primary/20 shadow-sm"
                                            onClick={() => handleUseModel(model)}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Usar Modelo
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Product Templates List */}
                            {activeTab === 'products' && filteredProductTemplates.map((template, index) => (
                                <motion.div
                                    key={template.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative rounded-2xl border-white/40 border-l-4 border-l-emerald-500"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleEditProductTemplate(template)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteProductTemplate(template.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-lg font-heading font-bold text-foreground pr-8">{template.name}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                                            {template.description || 'Sem descrição'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-xs font-bold text-emerald-600 border border-emerald-200/50">
                                            {template.product_type}
                                        </span>
                                        <span className="text-xs text-muted-foreground/40">•</span>
                                        <span className={`text-xs font-bold ${template.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                            {template.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded truncate border border-border/50">
                                            {template.requirements ? template.requirements.substring(0, 50) + '...' : 'Sem requisitos específicos'}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Contract Templates List */}
                            {activeTab === 'contracts' && filteredTemplates.map((template, index) => (
                                <motion.div
                                    key={template.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative rounded-2xl border-white/40 border-l-4 border-l-blue-500"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => handleEditTemplate(template)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            <h3 className="text-lg font-heading font-bold text-foreground pr-8">{template.name}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                                            {template.description || 'Sem descrição'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-xs font-bold text-blue-600 border border-blue-200/50">
                                            {template.category || 'Geral'}
                                        </span>
                                        <span className="text-xs text-muted-foreground/40">•</span>
                                        <span className={`text-xs font-bold ${template.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                            {template.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground font-mono bg-secondary/50 p-2 rounded truncate border border-border/50">
                                            {template.content.substring(0, 50)}...
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty State */}
                        {((activeTab === 'loads' && filteredModels.length === 0) ||
                            (activeTab === 'contracts' && filteredTemplates.length === 0) ||
                            (activeTab === 'products' && filteredProductTemplates.length === 0)) && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                                        {activeTab === 'contracts' ? <FileText className="w-8 h-8 opacity-50" /> : (activeTab === 'products' ? <Package className="w-8 h-8 opacity-50" /> : <Truck className="w-8 h-8 opacity-50" />)}
                                    </div>
                                    <p className="text-lg font-bold text-foreground">Nenhum modelo encontrado</p>
                                    <p className="text-sm">Crie um novo modelo para começar</p>
                                </div>
                            )}
                    </motion.div>
                )}
            </div>

            <ModelFormModal
                isOpen={isModelModalOpen}
                onClose={() => setIsModelModalOpen(false)}
                modelToEdit={selectedModel}
            />

            <ContractTemplateFormModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                templateToEdit={selectedTemplate}
            />

            <ProductTemplateFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                templateToEdit={selectedProductTemplate}
            />
        </motion.div>
    )
}
