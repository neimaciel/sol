import sys
import os

# Add the project root to sys.path
root_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(root_dir)
# Add backend dir to sys.path so imports like 'from core...' work inside main.py
sys.path.append(os.path.join(root_dir, 'backend'))

from backend.main import app
