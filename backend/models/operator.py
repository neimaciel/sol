from sqlalchemy import Column, String, DateTime, func, Boolean, Text
from sqlalchemy.orm import relationship
from core.database import Base
import hashlib
import secrets

class Operator(Base):
    __tablename__ = "operators"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Perfil e Acesso
    role = Column(String, default="OPERATOR")  # ADMIN, MANAGER, OPERATOR, VIEWER
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Informações do Perfil
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)  # OPERATIONS, FINANCIAL, COMMERCIAL
    photo = Column(String, nullable=True)
    
    # Permissões Específicas
    can_manage_drivers = Column(Boolean, default=True)
    can_manage_loads = Column(Boolean, default=True)
    can_confirm_payments = Column(Boolean, default=False)  # Apenas MANAGER+
    can_manage_operators = Column(Boolean, default=False)  # Apenas ADMIN
    can_access_reports = Column(Boolean, default=True)
    can_manage_contracts = Column(Boolean, default=False)
    
    # Autenticação
    last_login = Column(DateTime(timezone=True), nullable=True)
    login_attempts = Column(String, default="0")  # JSON com tentativas
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String, nullable=True)  # ID do operador que criou
    
    # Configurações Pessoais
    preferences = Column(Text, nullable=True)  # JSON com preferências do usuário
    notifications_enabled = Column(Boolean, default=True)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash da senha com salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}${password_hash.hex()}"
    
    def verify_password(self, password: str) -> bool:
        """Verificar senha"""
        try:
            salt, stored_hash = self.password_hash.split('$')
            password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            return password_hash.hex() == stored_hash
        except:
            return False
    
    def has_permission(self, permission: str) -> bool:
        """Verificar se tem uma permissão específica"""
        if not self.is_active:
            return False
        
        if self.is_superuser:
            return True
        
        permission_map = {
            'manage_drivers': self.can_manage_drivers,
            'manage_loads': self.can_manage_loads,
            'confirm_payments': self.can_confirm_payments,
            'manage_operators': self.can_manage_operators,
            'access_reports': self.can_access_reports,
            'manage_contracts': self.can_manage_contracts
        }
        
        return permission_map.get(permission, False)
    
    def get_role_display(self) -> str:
        """Nome amigável do cargo"""
        roles = {
            'ADMIN': 'Administrador',
            'MANAGER': 'Gerente',
            'OPERATOR': 'Operador',
            'VIEWER': 'Visualizador'
        }
        return roles.get(self.role, self.role)


class OperatorSession(Base):
    """Sessões ativas dos operadores"""
    __tablename__ = "operator_sessions"
    
    id = Column(String, primary_key=True)
    operator_id = Column(String, nullable=False, index=True)
    session_token = Column(String, unique=True, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


class OperatorActivity(Base):
    """Log de atividades dos operadores"""
    __tablename__ = "operator_activities"
    
    id = Column(String, primary_key=True)
    operator_id = Column(String, nullable=False, index=True)
    
    # Ação realizada
    action = Column(String, nullable=False)  # LOGIN, CREATE_LOAD, CONFIRM_PAYMENT, etc
    entity_type = Column(String, nullable=True)  # LOAD, DRIVER, PAYMENT, etc
    entity_id = Column(String, nullable=True)
    
    # Detalhes da ação
    description = Column(Text, nullable=True)
    extra_data = Column(Text, nullable=True)  # JSON com dados extras
    
    # Contexto
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())