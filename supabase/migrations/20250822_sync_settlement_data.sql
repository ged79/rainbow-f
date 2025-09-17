-- Fix settlement data consistency
-- Ensure order_ids array is always in sync with settlement_items

CREATE OR REPLACE FUNCTION sync_settlement_order_ids()
RETURNS TRIGGER AS $$
DECLARE
    v_settlement_id UUID;
BEGIN
    -- Determine settlement_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_settlement_id := OLD.settlement_id;
    ELSE
        v_settlement_id := NEW.settlement_id;
    END IF;
    
    -- Update order_ids array when settlement_items change
    UPDATE settlements
    SET order_ids = (
        SELECT array_agg(order_id)
        FROM settlement_items
        WHERE settlement_id = v_settlement_id
    ),
    total_orders = (
        SELECT COUNT(*)
        FROM settlement_items
        WHERE settlement_id = v_settlement_id
    )
    WHERE id = v_settlement_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settlement_items
DROP TRIGGER IF EXISTS sync_order_ids_on_items ON settlement_items;
CREATE TRIGGER sync_order_ids_on_items
AFTER INSERT OR UPDATE OR DELETE ON settlement_items
FOR EACH ROW
EXECUTE FUNCTION sync_settlement_order_ids();