import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv('.env') # Load from current directory (backend/)

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

async def check_session():
    print(f"🔍 Checking session for 5511999999999@s.whatsapp.net...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT * FROM conversations WHERE id = '5511999999999@s.whatsapp.net'"))
        row = result.fetchone()
        
        if row:
            print(f"✅ Session found!")
            print(f"   ID: {row.id}")
            print(f"   State: {row.state}")
            print(f"   Data: {row.data}")
        else:
            print("❌ Session NOT found!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_session())
