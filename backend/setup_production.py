"""
Script para setup de produção - criação de dados de exemplo
"""
import asyncio
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db, SessionLocal
from sqlalchemy import text

async def create_example_data():
    """Cria dados de exemplo na produção"""
    
    async with SessionLocal() as db:
        # Criar loads de exemplo
        loads_data = [
            {
                'id': 'load-example-1',
                'origin': 'São Paulo, SP',
                'destination': 'Rio de Janeiro, RJ', 
                'vehicle_type': 'TRUCK - RASTREADO',
                'value': '5000.00',
                'status': 'broadcast',
                'created_at': datetime.now().isoformat()
            }
        ]
        
        for load in loads_data:
            await db.execute(text("""
                INSERT INTO loads (id, origin, destination, vehicle_type, value, status, created_at)
                VALUES (:id, :origin, :destination, :vehicle_type, :value, :status, :created_at)
                ON CONFLICT (id) DO NOTHING
            """), load)
        
        # Criar grupos de exemplo
        groups_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Teste Produção',
                'type': 'Frota Própria',
                'description': 'Grupo de teste para produção',
                'region': 'São Paulo',
                'whatsapp_link': 'https://chat.whatsapp.com/Ifpkrx4NEvY1JzZjpzbc8b',
                'whatsapp_id': '120363403673457886@g.us',
                'members_count': 0,
                'created_at': datetime.now().isoformat()
            }
        ]
        
        for group in groups_data:
            await db.execute(text("""
                INSERT INTO groups (id, name, type, description, region, whatsapp_link, whatsapp_id, members_count, created_at)
                VALUES (:id, :name, :type, :description, :region, :whatsapp_link, :whatsapp_id, :members_count, :created_at)
                ON CONFLICT (id) DO NOTHING
            """), group)
        
        # Criar operador admin
        admin_data = {
            'id': str(uuid.uuid4()),
            'username': 'admin',
            'email': 'admin@sol-logistics.com',
            'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LfVeOUPw5UcZb9KDa',  # admin123
            'role': 'admin',
            'is_active': True,
            'created_at': datetime.now().isoformat()
        }
        
        await db.execute(text("""
            INSERT INTO operators (id, username, email, password_hash, role, is_active, created_at)
            VALUES (:id, :username, :email, :password_hash, :role, :is_active, :created_at)
            ON CONFLICT (username) DO NOTHING
        """), admin_data)
        
        await db.commit()
        print("✅ Dados de exemplo criados com sucesso!")

if __name__ == "__main__":
    asyncio.run(create_example_data())
