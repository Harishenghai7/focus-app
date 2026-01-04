-- Verify if the conversation exists
SELECT * FROM conversations WHERE id = 'c27b67d7-5778-4ed0-b837-8276200bd8df';

-- Verify if the user is a participant
SELECT * FROM conversation_participants 
WHERE conversation_id = 'c27b67d7-5778-4ed0-b837-8276200bd8df';
