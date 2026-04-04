-- Automatic checkout when user leaves venue geofence (app reports via client)
ALTER TYPE checkin_status ADD VALUE IF NOT EXISTS 'geofence_checkout';
