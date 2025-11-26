-- Create a new storage bucket for attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- NOTE: RLS is enabled by default on storage.objects, so we skip the ALTER TABLE command.

-- Allow public read access to files in the 'attachments' bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'attachments' );

-- Allow authenticated users to upload files to the 'attachments' bucket
create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- Allow authenticated users to update their own files
create policy "Authenticated Updates"
  on storage.objects for update
  using ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete files
create policy "Authenticated Deletes"
  on storage.objects for delete
  using ( bucket_id = 'attachments' and auth.role() = 'authenticated' );
