-- Insert sample operators
INSERT INTO operators (id, name, email, role) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Admin SOL', 'admin@sollogistica.com', 'admin'),
('550e8400-e29b-41d4-a716-446655440001', 'Maria Silva', 'maria@sollogistica.com', 'operator');

-- Insert sample drivers
INSERT INTO drivers (id, name, email, phone, license_number, vehicle_type, vehicle_plate) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'João Santos', 'joao@email.com', '(11) 99999-9999', 'ABC123456', 'Carreta', 'ABC-1234'),
('660e8400-e29b-41d4-a716-446655440001', 'Pedro Costa', 'pedro@email.com', '(11) 88888-8888', 'DEF789012', 'Truck', 'DEF-5678');

-- Insert sample groups
INSERT INTO groups (id, name, whatsapp_id, description) VALUES 
('770e8400-e29b-41d4-a716-446655440000', 'Motoristas SP', '5511999999999-1234567890@g.us', 'Grupo de motoristas de São Paulo'),
('770e8400-e29b-41d4-a716-446655440001', 'Carreteiros RJ', '5521888888888-0987654321@g.us', 'Grupo de carreteiros do Rio de Janeiro');

-- Insert sample loads (including the load-example-1 that was working in the WhatsApp test)
INSERT INTO loads (id, origin_city, origin_state, destination_city, destination_state, cargo_type, cargo_weight, cargo_value, price, pickup_date, delivery_date, status, created_by) VALUES 
('load-example-1', 'São Paulo', 'SP', 'Rio de Janeiro', 'RJ', 'Eletrônicos', 15000.00, 500000.00, 8500.00, '2024-12-28', '2024-12-30', 'available', '550e8400-e29b-41d4-a716-446655440000'),
('880e8400-e29b-41d4-a716-446655440001', 'Belo Horizonte', 'MG', 'Salvador', 'BA', 'Alimentos', 20000.00, 150000.00, 12000.00, '2024-12-29', '2025-01-02', 'available', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Porto Alegre', 'RS', 'Curitiba', 'PR', 'Materiais de Construção', 25000.00, 80000.00, 6500.00, '2024-12-30', '2025-01-03', 'assigned', '550e8400-e29b-41d4-a716-446655440000');

-- Update one load to be assigned to a driver
UPDATE loads SET driver_id = '660e8400-e29b-41d4-a716-446655440000' WHERE id = '880e8400-e29b-41d4-a716-446655440002';

-- Insert sample payments
INSERT INTO payments (id, load_id, driver_id, amount, status, payment_method, processed_at) VALUES 
('990e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 6500.00, 'completed', 'PIX', NOW() - INTERVAL '1 day'),
('990e8400-e29b-41d4-a716-446655440001', 'load-example-1', '660e8400-e29b-41d4-a716-446655440001', 8500.00, 'pending', 'Transferência', NULL);