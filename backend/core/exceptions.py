"""
Global exception handling for the application
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from pydantic import ValidationError
import logging
import traceback
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BusinessLogicError(Exception):
    """Custom exception for business logic errors"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class DatabaseError(Exception):
    """Custom exception for database errors"""
    def __init__(self, message: str, original_error: Exception = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)

class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(self.message)

def create_error_response(
    status_code: int,
    message: str,
    error_code: str = None,
    details: Dict[str, Any] = None
) -> JSONResponse:
    """Create standardized error response"""
    content = {
        "success": False,
        "error": {
            "message": message,
            "code": error_code,
            "status_code": status_code
        }
    }
    
    if details:
        content["error"]["details"] = details
        
    return JSONResponse(
        status_code=status_code,
        content=content
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    return create_error_response(
        status_code=exc.status_code,
        message=exc.detail,
        error_code="HTTP_ERROR"
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return create_error_response(
        status_code=422,
        message="Validation error",
        error_code="VALIDATION_ERROR",
        details={"validation_errors": errors}
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error: {exc}")
    
    if isinstance(exc, IntegrityError):
        # Handle foreign key, unique constraint violations
        if "UNIQUE constraint failed" in str(exc):
            field = str(exc).split(".")[-1] if "." in str(exc) else "unknown"
            return create_error_response(
                status_code=409,
                message=f"Record with this {field} already exists",
                error_code="DUPLICATE_ENTRY"
            )
        elif "FOREIGN KEY constraint failed" in str(exc):
            return create_error_response(
                status_code=400,
                message="Referenced record does not exist",
                error_code="INVALID_REFERENCE"
            )
    
    elif isinstance(exc, DataError):
        return create_error_response(
            status_code=400,
            message="Invalid data format",
            error_code="DATA_ERROR"
        )
    
    # Generic database error
    return create_error_response(
        status_code=500,
        message="Database error occurred",
        error_code="DATABASE_ERROR"
    )

async def business_logic_exception_handler(request: Request, exc: BusinessLogicError):
    """Handle business logic errors"""
    return create_error_response(
        status_code=400,
        message=exc.message,
        error_code=exc.error_code or "BUSINESS_ERROR"
    )

async def database_exception_handler(request: Request, exc: DatabaseError):
    """Handle custom database errors"""
    logger.error(f"Database error: {exc.message}")
    if exc.original_error:
        logger.error(f"Original error: {exc.original_error}")
    
    return create_error_response(
        status_code=500,
        message="A database error occurred",
        error_code="DATABASE_ERROR"
    )

async def validation_error_handler(request: Request, exc: ValidationError):
    """Handle custom validation errors"""
    details = {"field": exc.field} if exc.field else None
    
    return create_error_response(
        status_code=400,
        message=exc.message,
        error_code="VALIDATION_ERROR",
        details=details
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle any unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    # In production, don't expose internal error details
    return create_error_response(
        status_code=500,
        message="An unexpected error occurred",
        error_code="INTERNAL_ERROR"
    )

def setup_exception_handlers(app):
    """Setup all exception handlers for the FastAPI app"""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(BusinessLogicError, business_logic_exception_handler)
    app.add_exception_handler(DatabaseError, database_exception_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(Exception, general_exception_handler)