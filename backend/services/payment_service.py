import uuid
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update
from models.payment import Payment, PaymentMethod
from models.load import Load
from models.driver import Driver
from core.database import SessionLocal
import httpx
import os

class PaymentService:
    def __init__(self):
        self.stripe_api_key = os.getenv("STRIPE_SECRET_KEY")
        self.mercadopago_token = os.getenv("MERCADOPAGO_ACCESS_TOKEN") 
        self.asaas_api_key = os.getenv("ASAAS_API_KEY")

    async def create_payment(
        self, 
        load_id: str, 
        driver_id: str, 
        amount: float,
        payment_method: str = "MANUAL",
        gateway_provider: Optional[str] = None
    ) -> Payment:
        """Criar um novo pagamento (padrão: manual)"""
        async with SessionLocal() as db:
            # Verificar se já existe pagamento para esta carga
            existing = await db.execute(
                select(Payment).where(Payment.load_id == load_id)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Pagamento já existe para esta carga")

            # Buscar dados do motorista (para dados bancários)
            driver = await db.execute(
                select(Driver).where(Driver.id == driver_id)
            )
            driver = driver.scalar_one_or_none()
            if not driver:
                raise ValueError("Motorista não encontrado")

            payment = Payment(
                id=str(uuid.uuid4()),
                load_id=load_id,
                driver_id=driver_id,
                amount=amount,
                payment_method=payment_method,
                gateway_provider=gateway_provider,
                status="PENDING",
                # Copiar dados bancários do motorista
                bank_name=driver.bank_name,
                bank_agency=driver.bank_agency,
                bank_account=driver.bank_account,
                bank_account_type=driver.bank_account_type,
                pix_key=driver.pix_key,
                pix_key_type=driver.pix_key_type
            )

            db.add(payment)
            
            # Atualizar status da carga
            await db.execute(
                update(Load)
                .where(Load.id == load_id)
                .values(payment_status="PENDING")
            )
            
            await db.commit()
            await db.refresh(payment)
            return payment

    async def process_gateway_payment(
        self, 
        payment_id: str, 
        gateway_provider: str,
        payment_data: Dict[str, Any]
    ) -> Payment:
        """Processar pagamento via gateway"""
        async with SessionLocal() as db:
            payment = await db.execute(
                select(Payment).where(Payment.id == payment_id)
            )
            payment = payment.scalar_one_or_none()
            if not payment:
                raise ValueError("Pagamento não encontrado")

            try:
                if gateway_provider == "STRIPE":
                    result = await self._process_stripe_payment(payment, payment_data)
                elif gateway_provider == "MERCADO_PAGO":
                    result = await self._process_mercadopago_payment(payment, payment_data)
                elif gateway_provider == "ASAAS":
                    result = await self._process_asaas_payment(payment, payment_data)
                else:
                    raise ValueError(f"Gateway não suportado: {gateway_provider}")

                # Atualizar pagamento com resposta do gateway
                payment.gateway_payment_id = result.get("id")
                payment.gateway_response = json.dumps(result)
                payment.status = "PROCESSING" if result.get("status") == "pending" else "COMPLETED"
                payment.processed_at = datetime.utcnow()

                # Atualizar status da carga
                load_status = "PROCESSING" if payment.status == "PROCESSING" else "COMPLETED"
                await db.execute(
                    update(Load)
                    .where(Load.id == payment.load_id)
                    .values(payment_status=load_status)
                )

                await db.commit()
                await db.refresh(payment)
                return payment

            except Exception as e:
                payment.status = "FAILED"
                payment.gateway_response = json.dumps({"error": str(e)})
                await db.commit()
                raise e

    async def confirm_manual_payment(
        self, 
        payment_id: str, 
        confirmed_by: str,
        notes: Optional[str] = None,
        receipt_url: Optional[str] = None
    ) -> Payment:
        """Confirmar pagamento manual"""
        async with SessionLocal() as db:
            payment = await db.execute(
                select(Payment).where(Payment.id == payment_id)
            )
            payment = payment.scalar_one_or_none()
            if not payment:
                raise ValueError("Pagamento não encontrado")

            payment.status = "MANUAL_CONFIRMED"
            payment.manual_confirmed_by = confirmed_by
            payment.manual_confirmed_at = datetime.utcnow()
            payment.manual_confirmation_notes = notes
            payment.receipt_url = receipt_url
            payment.processed_at = datetime.utcnow()

            # Atualizar status da carga
            await db.execute(
                update(Load)
                .where(Load.id == payment.load_id)
                .values(payment_status="COMPLETED")
            )

            await db.commit()
            await db.refresh(payment)
            return payment

    async def get_payment_by_load(self, load_id: str) -> Optional[Payment]:
        """Buscar pagamento por carga"""
        async with SessionLocal() as db:
            result = await db.execute(
                select(Payment)
                .options(selectinload(Payment.load), selectinload(Payment.driver))
                .where(Payment.load_id == load_id)
            )
            return result.scalar_one_or_none()

    async def get_payment_methods(self, active_only: bool = True) -> List[PaymentMethod]:
        """Listar métodos de pagamento"""
        async with SessionLocal() as db:
            query = select(PaymentMethod)
            if active_only:
                query = query.where(PaymentMethod.is_active == True)
            
            result = await db.execute(query)
            return result.scalars().all()

    async def update_driver_bank_data(
        self,
        driver_id: str,
        bank_data: Dict[str, Any]
    ) -> Driver:
        """Atualizar dados bancários do motorista"""
        async with SessionLocal() as db:
            await db.execute(
                update(Driver)
                .where(Driver.id == driver_id)
                .values(**bank_data)
            )
            await db.commit()
            
            result = await db.execute(select(Driver).where(Driver.id == driver_id))
            return result.scalar_one()

    # Métodos privados para gateways
    async def _process_stripe_payment(self, payment: Payment, data: Dict) -> Dict:
        """Processar pagamento Stripe"""
        if not self.stripe_api_key:
            raise ValueError("Stripe não configurado")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.stripe.com/v1/payment_intents",
                headers={
                    "Authorization": f"Bearer {self.stripe_api_key}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "amount": int(payment.amount * 100),  # Stripe usa centavos
                    "currency": payment.currency.lower(),
                    "metadata": {
                        "load_id": payment.load_id,
                        "driver_id": payment.driver_id
                    }
                }
            )
            response.raise_for_status()
            return response.json()

    async def _process_mercadopago_payment(self, payment: Payment, data: Dict) -> Dict:
        """Processar pagamento Mercado Pago"""
        if not self.mercadopago_token:
            raise ValueError("Mercado Pago não configurado")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mercadopago.com/v1/payments",
                headers={
                    "Authorization": f"Bearer {self.mercadopago_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "transaction_amount": payment.amount,
                    "description": f"Frete - Carga {payment.load_id[:8]}",
                    "payment_method_id": data.get("payment_method_id", "pix"),
                    "payer": {
                        "email": data.get("payer_email", "noreply@sollogistica.com")
                    }
                }
            )
            response.raise_for_status()
            return response.json()

    async def _process_asaas_payment(self, payment: Payment, data: Dict) -> Dict:
        """Processar pagamento Asaas"""
        if not self.asaas_api_key:
            raise ValueError("Asaas não configurado")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.asaas.com/api/v3/payments",
                headers={
                    "access_token": self.asaas_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "billingType": data.get("billing_type", "PIX"),
                    "value": payment.amount,
                    "description": f"Frete - Carga {payment.load_id[:8]}",
                    "externalReference": payment.id
                }
            )
            response.raise_for_status()
            return response.json()

# Instância global
payment_service = PaymentService()