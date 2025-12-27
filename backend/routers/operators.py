from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from services.operator_service import operator_service
from models.operator import Operator
import re

router = APIRouter()
security = HTTPBearer()

# Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CreateOperatorRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "OPERATOR"
    phone: Optional[str] = None
    department: Optional[str] = None
    can_manage_drivers: bool = True
    can_manage_loads: bool = True
    can_confirm_payments: bool = False
    can_manage_operators: bool = False
    can_access_reports: bool = True
    can_manage_contracts: bool = False

class UpdateOperatorRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    can_manage_drivers: Optional[bool] = None
    can_manage_loads: Optional[bool] = None
    can_confirm_payments: Optional[bool] = None
    can_manage_operators: Optional[bool] = None
    can_access_reports: Optional[bool] = None
    can_manage_contracts: Optional[bool] = None
    password: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Dependency para autenticação
async def get_current_operator(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Operator:
    """Obter operador atual através do token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token de acesso requerido")
    
    operator = await operator_service.validate_session(credentials.credentials)
    if not operator:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    return operator

# Dependency para verificar permissões
def require_permission(permission: str):
    def permission_checker(current_operator: Operator = Depends(get_current_operator)):
        if not current_operator.has_permission(permission):
            raise HTTPException(status_code=403, detail=f"Permissão '{permission}' requerida")
        return current_operator
    return permission_checker

def get_client_info(request: Request) -> Dict[str, str]:
    """Extrair informações do cliente"""
    return {
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent", "")
    }

# Endpoints

@router.post("/auth/login")
async def login(request: LoginRequest, req: Request):
    """Login do operador"""
    try:
        client_info = get_client_info(req)
        result = await operator_service.authenticate(
            email=request.email,
            password=request.password,
            **client_info
        )
        return {
            "success": True,
            "message": "Login realizado com sucesso",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout do operador"""
    try:
        await operator_service.logout(credentials.credentials)
        return {"success": True, "message": "Logout realizado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/me")
async def get_current_user(current_operator: Operator = Depends(get_current_operator)):
    """Obter informações do operador atual"""
    return {
        "id": current_operator.id,
        "email": current_operator.email,
        "name": current_operator.name,
        "role": current_operator.role,
        "role_display": current_operator.get_role_display(),
        "department": current_operator.department,
        "phone": current_operator.phone,
        "photo": current_operator.photo,
        "is_superuser": current_operator.is_superuser,
        "last_login": current_operator.last_login,
        "created_at": current_operator.created_at,
        "permissions": {
            "can_manage_drivers": current_operator.can_manage_drivers,
            "can_manage_loads": current_operator.can_manage_loads,
            "can_confirm_payments": current_operator.can_confirm_payments,
            "can_manage_operators": current_operator.can_manage_operators,
            "can_access_reports": current_operator.can_access_reports,
            "can_manage_contracts": current_operator.can_manage_contracts
        }
    }

@router.post("/create")
async def create_operator(
    request: CreateOperatorRequest,
    current_operator: Operator = Depends(require_permission("manage_operators"))
):
    """Criar novo operador"""
    try:
        # Validação de senha
        if len(request.password) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        
        if not re.search(r'[A-Za-z]', request.password) or not re.search(r'\d', request.password):
            raise ValueError("Senha deve conter letras e números")
        
        # Validação de cargo
        valid_roles = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']
        if request.role not in valid_roles:
            raise ValueError(f"Cargo deve ser um de: {', '.join(valid_roles)}")
        
        # Apenas ADMIN pode criar outros ADMIN
        if request.role == 'ADMIN' and current_operator.role != 'ADMIN':
            raise ValueError("Apenas administradores podem criar outros administradores")
        
        operator = await operator_service.create_operator(
            email=request.email,
            name=request.name,
            password=request.password,
            role=request.role,
            phone=request.phone,
            department=request.department,
            can_manage_drivers=request.can_manage_drivers,
            can_manage_loads=request.can_manage_loads,
            can_confirm_payments=request.can_confirm_payments,
            can_manage_operators=request.can_manage_operators,
            can_access_reports=request.can_access_reports,
            can_manage_contracts=request.can_manage_contracts,
            created_by=current_operator.id
        )
        
        return {
            "success": True,
            "message": "Operador criado com sucesso",
            "operator": {
                "id": operator.id,
                "email": operator.email,
                "name": operator.name,
                "role": operator.role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/list")
async def list_operators(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    active_only: bool = True,
    current_operator: Operator = Depends(require_permission("manage_operators"))
):
    """Listar operadores"""
    try:
        operators = await operator_service.list_operators(
            skip=skip,
            limit=limit,
            role=role,
            active_only=active_only
        )
        
        return {
            "operators": [
                {
                    "id": op.id,
                    "email": op.email,
                    "name": op.name,
                    "role": op.role,
                    "role_display": op.get_role_display(),
                    "department": op.department,
                    "phone": op.phone,
                    "is_active": op.is_active,
                    "is_superuser": op.is_superuser,
                    "last_login": op.last_login,
                    "created_at": op.created_at,
                    "permissions": {
                        "can_manage_drivers": op.can_manage_drivers,
                        "can_manage_loads": op.can_manage_loads,
                        "can_confirm_payments": op.can_confirm_payments,
                        "can_manage_operators": op.can_manage_operators,
                        "can_access_reports": op.can_access_reports,
                        "can_manage_contracts": op.can_manage_contracts
                    }
                }
                for op in operators
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{operator_id}")
async def update_operator(
    operator_id: str,
    request: UpdateOperatorRequest,
    current_operator: Operator = Depends(require_permission("manage_operators"))
):
    """Atualizar operador"""
    try:
        # Filtrar apenas campos não nulos
        updates = {k: v for k, v in request.dict().items() if v is not None}
        
        # Validações
        if 'password' in updates and len(updates['password']) < 8:
            raise ValueError("Senha deve ter pelo menos 8 caracteres")
        
        if 'role' in updates:
            valid_roles = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']
            if updates['role'] not in valid_roles:
                raise ValueError(f"Cargo deve ser um de: {', '.join(valid_roles)}")
            
            # Apenas ADMIN pode alterar cargo para ADMIN
            if updates['role'] == 'ADMIN' and current_operator.role != 'ADMIN':
                raise ValueError("Apenas administradores podem promover outros administradores")
        
        # Não permitir que operador se desative
        if operator_id == current_operator.id and updates.get('is_active') is False:
            raise ValueError("Não é possível desativar sua própria conta")
        
        operator = await operator_service.update_operator(
            operator_id=operator_id,
            updates=updates,
            updated_by=current_operator.id
        )
        
        return {
            "success": True,
            "message": "Operador atualizado com sucesso",
            "operator": {
                "id": operator.id,
                "email": operator.email,
                "name": operator.name,
                "role": operator.role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{operator_id}/deactivate")
async def deactivate_operator(
    operator_id: str,
    current_operator: Operator = Depends(require_permission("manage_operators"))
):
    """Desativar operador"""
    try:
        if operator_id == current_operator.id:
            raise ValueError("Não é possível desativar sua própria conta")
        
        await operator_service.deactivate_operator(
            operator_id=operator_id,
            deactivated_by=current_operator.id
        )
        
        return {
            "success": True,
            "message": "Operador desativado com sucesso"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_operator: Operator = Depends(get_current_operator)
):
    """Alterar senha do operador atual"""
    try:
        # Verificar senha atual
        if not current_operator.verify_password(request.current_password):
            raise ValueError("Senha atual incorreta")
        
        # Validar nova senha
        if len(request.new_password) < 8:
            raise ValueError("Nova senha deve ter pelo menos 8 caracteres")
        
        if not re.search(r'[A-Za-z]', request.new_password) or not re.search(r'\d', request.new_password):
            raise ValueError("Nova senha deve conter letras e números")
        
        # Atualizar senha
        await operator_service.update_operator(
            operator_id=current_operator.id,
            updates={"password": request.new_password}
        )
        
        return {
            "success": True,
            "message": "Senha alterada com sucesso"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/activities")
async def get_activities(
    operator_id: Optional[str] = None,
    action: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_operator: Operator = Depends(get_current_operator)
):
    """Obter atividades dos operadores"""
    try:
        # Se não é admin/manager, só pode ver suas próprias atividades
        if current_operator.role not in ['ADMIN', 'MANAGER'] and operator_id != current_operator.id:
            operator_id = current_operator.id
        
        activities = await operator_service.get_operator_activities(
            operator_id=operator_id,
            action=action,
            skip=skip,
            limit=limit
        )
        
        return {
            "activities": [
                {
                    "id": activity.id,
                    "operator_id": activity.operator_id,
                    "action": activity.action,
                    "entity_type": activity.entity_type,
                    "entity_id": activity.entity_id,
                    "description": activity.description,
                    "ip_address": activity.ip_address,
                    "created_at": activity.created_at
                }
                for activity in activities
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roles")
async def get_roles():
    """Listar cargos disponíveis"""
    return {
        "roles": [
            {"value": "ADMIN", "label": "Administrador", "description": "Acesso total ao sistema"},
            {"value": "MANAGER", "label": "Gerente", "description": "Gerenciamento de operações e relatórios"},
            {"value": "OPERATOR", "label": "Operador", "description": "Operações básicas de cargas e motoristas"},
            {"value": "VIEWER", "label": "Visualizador", "description": "Apenas visualização de dados"}
        ]
    }

@router.get("/permissions")
async def get_permissions():
    """Listar permissões disponíveis"""
    return {
        "permissions": [
            {"key": "can_manage_drivers", "label": "Gerenciar Motoristas", "description": "Criar, editar e remover motoristas"},
            {"key": "can_manage_loads", "label": "Gerenciar Cargas", "description": "Criar, editar e gerenciar cargas"},
            {"key": "can_confirm_payments", "label": "Confirmar Pagamentos", "description": "Confirmar e gerenciar pagamentos"},
            {"key": "can_manage_operators", "label": "Gerenciar Operadores", "description": "Criar e gerenciar outros operadores"},
            {"key": "can_access_reports", "label": "Acessar Relatórios", "description": "Visualizar relatórios e analytics"},
            {"key": "can_manage_contracts", "label": "Gerenciar Contratos", "description": "Criar e gerenciar contratos"}
        ]
    }