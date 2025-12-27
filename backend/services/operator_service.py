import uuid
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete, and_, or_
from models.operator import Operator, OperatorSession, OperatorActivity
from core.database import SessionLocal

class OperatorService:
    def __init__(self):
        self.session_duration = timedelta(hours=8)  # 8 horas por sessão

    async def create_operator(
        self,
        email: str,
        name: str,
        password: str,
        role: str = "OPERATOR",
        created_by: Optional[str] = None,
        **kwargs
    ) -> Operator:
        """Criar novo operador"""
        async with SessionLocal() as db:
            # Verificar se email já existe
            existing = await db.execute(
                select(Operator).where(Operator.email == email)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Email já cadastrado")

            # Criar operador
            operator = Operator(
                id=str(uuid.uuid4()),
                email=email,
                name=name,
                password_hash=Operator.hash_password(password),
                role=role,
                created_by=created_by,
                **kwargs
            )

            db.add(operator)
            await db.commit()
            await db.refresh(operator)
            
            # Log da atividade
            await self.log_activity(
                operator_id=created_by or operator.id,
                action="CREATE_OPERATOR",
                entity_type="OPERATOR",
                entity_id=operator.id,
                description=f"Operador {operator.name} criado"
            )
            
            return operator

    async def authenticate(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Autenticar operador e criar sessão"""
        async with SessionLocal() as db:
            # Buscar operador
            result = await db.execute(
                select(Operator).where(
                    and_(Operator.email == email, Operator.is_active == True)
                )
            )
            operator = result.scalar_one_or_none()
            
            if not operator or not operator.verify_password(password):
                # Log tentativa de login falhada
                if operator:
                    await self.log_activity(
                        operator_id=operator.id,
                        action="LOGIN_FAILED",
                        description="Tentativa de login com senha incorreta",
                        ip_address=ip_address
                    )
                raise ValueError("Email ou senha incorretos")

            # Atualizar último login
            operator.last_login = datetime.utcnow()
            
            # Criar sessão
            session_token = secrets.token_urlsafe(32)
            session = OperatorSession(
                id=str(uuid.uuid4()),
                operator_id=operator.id,
                session_token=session_token,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=datetime.utcnow() + self.session_duration
            )
            
            db.add(session)
            await db.commit()
            
            # Log login bem-sucedido
            await self.log_activity(
                operator_id=operator.id,
                action="LOGIN_SUCCESS",
                description="Login realizado com sucesso",
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return {
                "operator": {
                    "id": operator.id,
                    "email": operator.email,
                    "name": operator.name,
                    "role": operator.role,
                    "permissions": {
                        "can_manage_drivers": operator.can_manage_drivers,
                        "can_manage_loads": operator.can_manage_loads,
                        "can_confirm_payments": operator.can_confirm_payments,
                        "can_manage_operators": operator.can_manage_operators,
                        "can_access_reports": operator.can_access_reports,
                        "can_manage_contracts": operator.can_manage_contracts
                    }
                },
                "session_token": session_token,
                "expires_at": session.expires_at
            }

    async def validate_session(self, session_token: str) -> Optional[Operator]:
        """Validar sessão ativa"""
        async with SessionLocal() as db:
            result = await db.execute(
                select(OperatorSession, Operator)
                .join(Operator, OperatorSession.operator_id == Operator.id)
                .where(
                    and_(
                        OperatorSession.session_token == session_token,
                        OperatorSession.is_active == True,
                        OperatorSession.expires_at > datetime.utcnow(),
                        Operator.is_active == True
                    )
                )
            )
            result = result.first()
            
            if not result:
                return None
            
            session_obj, operator = result
            
            # Atualizar última atividade
            session_obj.last_activity = datetime.utcnow()
            await db.commit()
            
            return operator

    async def logout(self, session_token: str):
        """Fazer logout (invalidar sessão)"""
        async with SessionLocal() as db:
            await db.execute(
                update(OperatorSession)
                .where(OperatorSession.session_token == session_token)
                .values(is_active=False)
            )
            await db.commit()

    async def get_operator_by_id(self, operator_id: str) -> Optional[Operator]:
        """Buscar operador por ID"""
        async with SessionLocal() as db:
            result = await db.execute(
                select(Operator).where(Operator.id == operator_id)
            )
            return result.scalar_one_or_none()

    async def list_operators(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        active_only: bool = True
    ) -> List[Operator]:
        """Listar operadores"""
        async with SessionLocal() as db:
            query = select(Operator)
            
            if active_only:
                query = query.where(Operator.is_active == True)
            
            if role:
                query = query.where(Operator.role == role)
            
            query = query.offset(skip).limit(limit).order_by(Operator.created_at.desc())
            
            result = await db.execute(query)
            return result.scalars().all()

    async def update_operator(
        self,
        operator_id: str,
        updates: Dict[str, Any],
        updated_by: Optional[str] = None
    ) -> Operator:
        """Atualizar operador"""
        async with SessionLocal() as db:
            # Hash da senha se fornecida
            if 'password' in updates:
                updates['password_hash'] = Operator.hash_password(updates.pop('password'))
            
            # Atualizar
            await db.execute(
                update(Operator)
                .where(Operator.id == operator_id)
                .values(**updates)
            )
            
            await db.commit()
            
            # Buscar operador atualizado
            result = await db.execute(
                select(Operator).where(Operator.id == operator_id)
            )
            operator = result.scalar_one()
            
            # Log da atividade
            if updated_by:
                await self.log_activity(
                    operator_id=updated_by,
                    action="UPDATE_OPERATOR",
                    entity_type="OPERATOR",
                    entity_id=operator_id,
                    description=f"Operador {operator.name} atualizado"
                )
            
            return operator

    async def deactivate_operator(
        self,
        operator_id: str,
        deactivated_by: Optional[str] = None
    ):
        """Desativar operador"""
        async with SessionLocal() as db:
            # Desativar operador
            await db.execute(
                update(Operator)
                .where(Operator.id == operator_id)
                .values(is_active=False)
            )
            
            # Invalidar todas as sessões
            await db.execute(
                update(OperatorSession)
                .where(OperatorSession.operator_id == operator_id)
                .values(is_active=False)
            )
            
            await db.commit()
            
            # Log da atividade
            if deactivated_by:
                await self.log_activity(
                    operator_id=deactivated_by,
                    action="DEACTIVATE_OPERATOR",
                    entity_type="OPERATOR",
                    entity_id=operator_id,
                    description="Operador desativado"
                )

    async def log_activity(
        self,
        operator_id: str,
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Registrar atividade do operador"""
        async with SessionLocal() as db:
            activity = OperatorActivity(
                id=str(uuid.uuid4()),
                operator_id=operator_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                description=description,
                extra_data=json.dumps(metadata) if metadata else None,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.add(activity)
            await db.commit()

    async def get_operator_activities(
        self,
        operator_id: Optional[str] = None,
        action: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[OperatorActivity]:
        """Buscar atividades dos operadores"""
        async with SessionLocal() as db:
            query = select(OperatorActivity)
            
            if operator_id:
                query = query.where(OperatorActivity.operator_id == operator_id)
            
            if action:
                query = query.where(OperatorActivity.action == action)
            
            query = query.offset(skip).limit(limit).order_by(OperatorActivity.created_at.desc())
            
            result = await db.execute(query)
            return result.scalars().all()

    async def cleanup_expired_sessions(self):
        """Limpar sessões expiradas"""
        async with SessionLocal() as db:
            await db.execute(
                update(OperatorSession)
                .where(OperatorSession.expires_at < datetime.utcnow())
                .values(is_active=False)
            )
            await db.commit()

# Instância global
operator_service = OperatorService()