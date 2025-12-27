from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from services.payment_service import payment_service
import uuid
import os

router = APIRouter()

# Schemas
class CreatePaymentRequest(BaseModel):
    load_id: str
    driver_id: str
    amount: float
    payment_method: str = "MANUAL"
    gateway_provider: Optional[str] = None

class ConfirmManualPaymentRequest(BaseModel):
    confirmed_by: str
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

class ProcessGatewayPaymentRequest(BaseModel):
    gateway_provider: str
    payment_data: Dict[str, Any]

class UpdateBankDataRequest(BaseModel):
    bank_name: Optional[str] = None
    bank_agency: Optional[str] = None
    bank_account: Optional[str] = None
    bank_account_type: Optional[str] = None
    pix_key: Optional[str] = None
    pix_key_type: Optional[str] = None

# Endpoints
@router.post("/create")
async def create_payment(request: CreatePaymentRequest):
    """Criar novo pagamento (padrão: manual)"""
    try:
        payment = await payment_service.create_payment(
            load_id=request.load_id,
            driver_id=request.driver_id,
            amount=request.amount,
            payment_method=request.payment_method,
            gateway_provider=request.gateway_provider
        )
        return {
            "success": True,
            "payment_id": payment.id,
            "status": payment.status,
            "method": payment.payment_method,
            "message": "Pagamento criado com sucesso"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{payment_id}/confirm-manual")
async def confirm_manual_payment(payment_id: str, request: ConfirmManualPaymentRequest):
    """Confirmar pagamento manual"""
    try:
        payment = await payment_service.confirm_manual_payment(
            payment_id=payment_id,
            confirmed_by=request.confirmed_by,
            notes=request.notes,
            receipt_url=request.receipt_url
        )
        return {
            "success": True,
            "status": payment.status,
            "confirmed_at": payment.manual_confirmed_at,
            "message": "Pagamento confirmado manualmente"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{payment_id}/process-gateway")
async def process_gateway_payment(payment_id: str, request: ProcessGatewayPaymentRequest):
    """Processar pagamento via gateway"""
    try:
        payment = await payment_service.process_gateway_payment(
            payment_id=payment_id,
            gateway_provider=request.gateway_provider,
            payment_data=request.payment_data
        )
        return {
            "success": True,
            "status": payment.status,
            "gateway_payment_id": payment.gateway_payment_id,
            "message": "Pagamento processado via gateway"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/load/{load_id}")
async def get_payment_by_load(load_id: str):
    """Buscar pagamento por carga"""
    try:
        payment = await payment_service.get_payment_by_load(load_id)
        if not payment:
            return {"payment": None, "message": "Nenhum pagamento encontrado"}
        
        return {
            "payment": {
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "method": payment.payment_method,
                "gateway_provider": payment.gateway_provider,
                "created_at": payment.created_at,
                "processed_at": payment.processed_at,
                "manual_confirmed_by": payment.manual_confirmed_by,
                "manual_confirmed_at": payment.manual_confirmed_at,
                "manual_confirmation_notes": payment.manual_confirmation_notes,
                "receipt_url": payment.receipt_url,
                "bank_data": {
                    "bank_name": payment.bank_name,
                    "bank_agency": payment.bank_agency,
                    "bank_account": payment.bank_account,
                    "bank_account_type": payment.bank_account_type,
                    "pix_key": payment.pix_key,
                    "pix_key_type": payment.pix_key_type
                } if payment.payment_method == "MANUAL" else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/methods")
async def get_payment_methods(active_only: bool = True):
    """Listar métodos de pagamento disponíveis"""
    try:
        methods = await payment_service.get_payment_methods(active_only)
        return {
            "methods": [
                {
                    "id": method.id,
                    "name": method.name,
                    "type": method.type,
                    "gateway_provider": method.gateway_provider,
                    "requires_bank_data": method.requires_bank_data,
                    "supports_instant": method.supports_instant,
                    "processing_time": method.processing_time
                }
                for method in methods
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/driver/{driver_id}/bank-data")
async def update_driver_bank_data(driver_id: str, request: UpdateBankDataRequest):
    """Atualizar dados bancários do motorista"""
    try:
        # Filtrar apenas campos não nulos
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
        
        driver = await payment_service.update_driver_bank_data(driver_id, update_data)
        return {
            "success": True,
            "message": "Dados bancários atualizados",
            "bank_data": {
                "bank_name": driver.bank_name,
                "bank_agency": driver.bank_agency,
                "bank_account": driver.bank_account,
                "bank_account_type": driver.bank_account_type,
                "pix_key": driver.pix_key,
                "pix_key_type": driver.pix_key_type
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{payment_id}/upload-receipt")
async def upload_receipt(payment_id: str, file: UploadFile = File(...)):
    """Upload de comprovante de pagamento"""
    try:
        # Validar tipo de arquivo
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Tipo de arquivo não permitido. Use JPEG, PNG ou PDF"
            )

        # Criar diretório se não existir
        upload_dir = "uploads/receipts"
        os.makedirs(upload_dir, exist_ok=True)

        # Gerar nome único
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "unknown"
        filename = f"{payment_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        filepath = os.path.join(upload_dir, filename)

        # Salvar arquivo
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # URL relativa para o arquivo
        receipt_url = f"/uploads/receipts/{filename}"

        return {
            "success": True,
            "receipt_url": receipt_url,
            "filename": filename,
            "message": "Comprovante enviado com sucesso"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Webhook para gateways (exemplo genérico)
@router.post("/webhook/{provider}")
async def payment_webhook(provider: str, payload: Dict[str, Any]):
    """Webhook para receber atualizações dos gateways de pagamento"""
    try:
        # Log do webhook
        print(f"Webhook recebido de {provider}: {payload}")
        
        # Aqui você processaria a atualização específica de cada gateway
        # Por exemplo, para Stripe:
        if provider == "stripe":
            # Validar webhook signature (implementar validação real)
            # Processar evento do Stripe
            pass
        elif provider == "mercadopago":
            # Processar notificação do Mercado Pago
            pass
        elif provider == "asaas":
            # Processar webhook do Asaas
            pass
        
        return {"status": "received"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))