-- Add missing INSERT policy for chats: authenticated users can create venue_general chats
CREATE POLICY chats_insert ON chats FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow venue owners to read messages in their venue's chats (even if not a participant yet)
CREATE POLICY messages_select_venue_owner ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      JOIN venues v ON v.id = c.venue_id
      WHERE c.id = messages.chat_id
        AND v.owner_id = auth.uid()
    )
  );
