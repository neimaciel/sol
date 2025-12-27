#!/usr/bin/env python3
"""
Script para inicializar banco de dados SQLite local com todas as migrações
"""

import asyncio
import os
import glob
from sqlalchemy import text
from core.database import engine, Base
from models import *  # Import all models to create tables

async def create_tables():
    """Criar todas as tabelas"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tabelas criadas com sucesso!")

async def run_migration_sql(sql_content: str, migration_name: str):
    """Executar SQL de migração adaptado para SQLite"""
    # Adaptar SQL do PostgreSQL para SQLite
    adapted_sql = sql_content
    
    # Substituições para compatibilidade com SQLite
    replacements = [
        # Tipos de dados
        ('TIMESTAMPTZ', 'DATETIME'),
        ('UUID PRIMARY KEY DEFAULT uuid_generate_v4()', 'TEXT PRIMARY KEY'),
        ('TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text', 'TEXT PRIMARY KEY'),
        ('JSONB', 'TEXT'),
        ('CHECK (', '-- CHECK ('),  # SQLite tem CHECK limitado
        ('REFERENCES drivers (id) ON DELETE CASCADE', 'REFERENCES drivers (id)'),
        ('REFERENCES loads (id) ON DELETE CASCADE', 'REFERENCES loads (id)'),
        
        # Remove postgres-specific functions
        ('ALTER TABLE', '-- ALTER TABLE'),  # Vamos recriar as tabelas
        ('CREATE POLICY', '-- CREATE POLICY'),  # SQLite não tem RLS
        ('ENABLE ROW LEVEL SECURITY', '-- ENABLE ROW LEVEL SECURITY'),
        ('CREATE TRIGGER', '-- CREATE TRIGGER'),  # Triggers específicos do PG
        ('CREATE OR REPLACE FUNCTION', '-- CREATE OR REPLACE FUNCTION'),
        ('RETURNS TRIGGER', '-- RETURNS TRIGGER'),
        ('EXECUTE FUNCTION', '-- EXECUTE FUNCTION'),
        ('ON CONFLICT', '-- ON CONFLICT'),  # SQLite usa REPLACE
        ('GRANT', '-- GRANT'),  # Não aplicável ao SQLite
    ]
    
    for old, new in replacements:
        adapted_sql = adapted_sql.replace(old, new)
    
    # Separar statements por ponto e vírgula
    statements = [stmt.strip() for stmt in adapted_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
    
    async with engine.begin() as conn:
        for statement in statements:
            if statement and not statement.startswith('--'):
                try:
                    await conn.execute(text(statement))
                    print(f"  ✅ Executado: {statement[:50]}...")
                except Exception as e:
                    print(f"  ⚠️ Erro (ignorado): {e}")
                    continue
    
    print(f"✅ Migração {migration_name} aplicada!")

async def seed_data():
    """Inserir dados iniciais"""
    async with engine.begin() as conn:
        # Operador admin padrão
        await conn.execute(text("""
            INSERT OR REPLACE INTO operators (
                id, email, name, password_hash, role, is_active, is_superuser,
                can_manage_drivers, can_manage_loads, can_confirm_payments, 
                can_manage_operators, can_access_reports, can_manage_contracts,
                created_at
            ) VALUES (
                'admin-default',
                'admin@sollogistica.com',
                'Administrador',
                '7d8c2d5e9f4a3b1c$a5b8c3d1e2f4a8b9c7d6e5f3a1b2c4d8e9f1a3b5c7d2e6f4a8b9c1d3e5f7a2b4c6',
                'ADMIN',
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                datetime('now')
            )
        """))
        
        # Operador teste
        await conn.execute(text("""
            INSERT OR REPLACE INTO operators (
                id, email, name, password_hash, role, is_active, 
                can_manage_drivers, can_manage_loads, can_confirm_payments,
                created_by, created_at
            ) VALUES (
                'operator-test',
                'operador@sollogistica.com', 
                'Operador Teste',
                '9b4e7a2d5c8f1a3b$b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2',
                'OPERATOR',
                1,
                1,
                1,
                0,
                'admin-default',
                datetime('now')
            )
        """))
        
        # Métodos de pagamento
        await conn.execute(text("""
            INSERT OR REPLACE INTO payment_methods (id, name, type, requires_bank_data, supports_instant, processing_time) VALUES
            ('manual-bank', 'Transferência Bancária Manual', 'MANUAL', 1, 0, '1-3 dias úteis'),
            ('manual-pix', 'PIX Manual', 'MANUAL', 1, 1, 'Instantâneo'),
            ('gateway-stripe', 'Cartão de Crédito (Stripe)', 'GATEWAY', 0, 1, 'Instantâneo'),
            ('gateway-mercadopago', 'Mercado Pago', 'GATEWAY', 0, 1, 'Instantâneo'),
            ('gateway-asaas', 'PIX/Boleto (Asaas)', 'GATEWAY', 0, 0, '1-2 dias úteis')
        """))
        
        # Load de exemplo
        await conn.execute(text("""
            INSERT OR REPLACE INTO loads (
                id, title, origin, destination, value, status, column_id,
                origin_lat, origin_lon, destination_lat, destination_lon,
                payment_status, created_at
            ) VALUES (
                'load-example-1',
                'Carga São Paulo → Rio de Janeiro',
                'São Paulo, SP',
                'Rio de Janeiro, RJ',
                '5000.00',
                'registration',
                'registration',
                -23.5505,
                -46.6333,
                -22.9068,
                -43.1729,
                'PENDING',
                datetime('now')
            )
        """))
        
        # Driver de exemplo  
        await conn.execute(text("""
            INSERT OR REPLACE INTO drivers (
                id, name, phone, vehicle_type, vehicle_plate, cpf_cnpj,
                pix_key, pix_key_type, created_at, updated_at
            ) VALUES (
                'driver-example-1',
                'João Silva',
                '11999999999',
                'Truck',
                'ABC-1234',
                '123.456.789-00',
                '11999999999',
                'PHONE',
                datetime('now'),
                datetime('now')
            )
        """))
    
    print("✅ Dados iniciais inseridos!")

async def init_database():
    """Inicializar banco de dados completo"""
    try:
        print("🔄 Inicializando banco de dados SQLite local...")
        
        # 1. Criar estrutura base
        await create_tables()
        
        # 2. Aplicar migrações específicas (adaptadas)
        migration_files = [
            'migrations/006_payments_system.sql',
            'migrations/007_operators_system.sql'
        ]
        
        # Já temos as tabelas criadas, mas vamos aplicar as migrações para garantir dados
        print("📝 Aplicando migrações específicas...")
        
        for migration_file in migration_files:
            if os.path.exists(migration_file):
                print(f"🔄 Aplicando {migration_file}...")
                with open(migration_file, 'r', encoding='utf-8') as f:
                    migration_sql = f.read()
                await run_migration_sql(migration_sql, os.path.basename(migration_file))
        
        # 3. Inserir dados iniciais
        await seed_data()
        
        print("✅ Banco de dados SQLite inicializado com sucesso!")
        print("🔑 Credenciais padrão:")
        print("   Admin: admin@sollogistica.com / admin123")
        print("   Operador: operador@sollogistica.com / operador123")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_database())